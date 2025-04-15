import { z } from 'zod';
import { MessageState, setupSchema } from './schema.js';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Command, END } from '@langchain/langgraph';
import { cwd } from 'process';
import { join } from 'path';
import { readFileSync } from 'fs';
import { agentModel } from './agent.js';
import { reflectionSchema } from './reflection.js';

const uploadingPlayer = "gklinsing";
const srcDir = join(cwd(), "src");
const battleFilePath = join(srcDir, "../sampleBattleReplays", "battle.txt");
const battleFile = readFileSync(battleFilePath, "utf-8");

const setupOutputSchema = z.object({
  setup: setupSchema,
  turnBlocks: z.array(z.string()),
  winner: z.string().describe("The winner of the game."),
});

export const setupNode = async (state: typeof MessageState.State) => {
  const messages = [
    new SystemMessage(`You are a Pokèmon TCG Live battle log parsing assistant.
Gather the opening cards drawn for each player.
Gather which Pokémon are active and on the bench for each player.
The "uploadingPlayer" is ${uploadingPlayer}. The other player is the opponent.
Get the turn blocks for each player.`),
    new HumanMessage(`Here is the battle log: ${battleFile}`),
  ];

  const response = await agentModel.withStructuredOutput(setupOutputSchema).invoke(messages);
  console.log("Setup parsing complete");
  return new Command({
    update: {
      ...state,
      setup: response.setup,
      turnBlocks: response.turnBlocks,
      winner: response.winner,
    },
    goto: "reflectionSetupNode",
  })
};

export const reflectionSetupNode = async (state: typeof MessageState.State) => {
  const messages = [
    new SystemMessage(`You are a Pokèmon TCG Live battle log validation assistant.
Varify that the "uploadingPlayer" is ${uploadingPlayer}.
Check that all turns are accounted for, there is a winner, and starting hands are correct.
Reurn a pass or fail and a reason for the result.`),
    new AIMessage(`Here is the parsed battle log: ${JSON.stringify(state.setup, null, 2)}`),
  ];

  const newSetupProcessCount = state.setupProcessCount + 1;
  let response = {
    result: "Fail",
    reason: "unknown",
  };
  
  try {
    response = await agentModel.withStructuredOutput(reflectionSchema).invoke(messages);
    if (response.result === "Pass") {
      return new Command({
        update: {
          ...state,
          setupProcessCount: newSetupProcessCount,
        },
        goto: "processTurns",
      });
    }
  }
  catch (error) {
    console.error("Error during setup reflection:", error);
  }
  
  console.log(`Setup validation failed: ${response.reason}`);
  const goto = newSetupProcessCount === 3 ? END : "setupNode";
  return new Command({
    update: {
      ...state,
      setupProcessCount: newSetupProcessCount,
    },
    goto,
  });
};