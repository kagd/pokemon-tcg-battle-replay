import 'dotenv/config'
import { AzureChatOpenAI } from "@langchain/openai";
import { END, StateGraph, START, Annotation } from "@langchain/langgraph";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { join } from 'path';
import { readFileSync } from 'fs';
import { cwd } from 'process';
import { z } from 'zod';

const agentModel = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY, // In Node.js defaults to process.env.AZURE_OPENAI_API_KEY
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME, // In Node.js defaults to process.env.AZURE_OPENAI_API_INSTANCE_NAME
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME, // In Node.js defaults to process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION, // In Node.js defaults to process.env.AZURE_OPENAI_API_VERSION
  model: process.env.AZURE_OPENAI_MODEL_NAME, // In Node.js defaults to process.env.AZURE_OPENAI_MODEL_NAME
  temperature: 0.7,
  maxTokens: undefined,
  maxRetries: 2,
});

const setup = z.object({
  uploadingPlayer: z.string(),
  opponent: z.string(),
  coinFlip: z.object({
    caller: z.string(),
    called: z.enum(["heads", "tails"]),
    result: z.enum(["win", "lose"]),
  }),
  openingHands: z.object({
    uploadingPlayer: z.object({
      size: z.number(),
      cards: z.array(z.string()),
    }),
    opponent: z.object({
      size: z.number(),
    }),
  }),
  initialSetup: z.object({
    uploadingPlayer: z.object({
      active: z.string(),
      bench: z.array(z.string()),
    }),
    opponent: z.object({
      active: z.string(),
      bench: z.array(z.string()),
    }),
  }),
});

const setupOutputSchema = z.object({
  setup: setup,
  turnBlocks: z.array(z.string()),
  winner: z.string().describe("The winner of the game."),
});

// Define the top-level State interface
const MessageState = Annotation.Root({
  setup: Annotation<typeof setup>(),
  turnBlocks: Annotation<Array<string>>(),
  winner: Annotation<string>(),
});
const uploadingPlayer = "gklinsing";
const srcDir = join(cwd(), "src");
const battleFilePath = join(srcDir, "../sampleBattleReplays", "battle.txt");
const battleFile = readFileSync(battleFilePath, "utf-8");

const setupNode = async (state: typeof MessageState.State) => {
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
  return {
    ...state,
    setup: response.setup,
    turnBlocks: response.turnBlocks,
    winner: response.winner,
  }
};

const reflectionSchema = z.object({
  result: z.enum(["Pass", "Fail"]),
  reason: z.string(),
});

const reflectionNode = async (state: typeof MessageState.State) => {
  const messages = [
      new SystemMessage(`You are a Pokèmon TCG Live battle log validation assistant.
Varify that the "uploadingPlayer" is ${uploadingPlayer}.
Check that all turns are accounted for, there is a winner, and starting hands are correct.
Reurn a pass or fail and a reason for the result.`),
      new AIMessage(`Here is the parsed battle log: ${JSON.stringify(state.setup, null, 2)}`),
    ];

  const response = await agentModel.withStructuredOutput(reflectionSchema).invoke(messages);
  if (response.result === "Pass") {
    console.log("Setup validation passed");
  }
  else {
    console.log("Setup validation failed");
  }
  return response.result;
};

const turnSchema = z.object({
  turnNumber: z.number(),
  player: z.string().describe('The player id or name'), // Player ID, e.g., "Shinwrld" or "gklinsing"
  actions: z.array(z.object({
    type: z.enum(["ability", "draw", "play", "attach", "retreat", "newActivePokemon", "item", "discard", "attack", "shuffle"]),
    cardOrAction: z.string().optional(), // Card name
    cardType: z.enum(["energy", "trainer", "pokemon"]).optional(), // Optional, Type of the card
    result: z.array(z.object({
      type: z.enum(["ability", "draw", "play", "attach", "retreat", "newActivePokemon", "item", "discard", "attack", "shuffle", "knockout"]),
      cardOrAction: z.string().optional(), // Card name
      cardType: z.enum(["energy", "trainer", "pokemon"]).optional(), // Optional, Type of the card
      target: z.string().optional(), // Target Pokémon for attach or retreat
      location: z.enum(["active", "bench", "hand", "deck", "discard", "prize", "lostZone", "stadium"]).optional(), // Where the card was moved to
      player: z.string().optional(), // Player ID
    })).optional(), // Optional, describes the outcome of the action
    target: z.string().optional(), // Target Pokémon for attach or retreat
    location: z.enum(["active", "bench", "hand", "deck", "discard", "prize", "lostZone", "stadium"]).optional(), // Where the card was moved to
  })),
  attacks: z.array(z.object({
    attacker: z.string(), // The Pokémon that is attacking
    move: z.string(), // Name of the attack
    target: z.string(), // The Pokémon being attacked
    damage: z.number(), // Amount of damage dealt
    result: z.enum(["knockout", "hit"]), // Outcome of the attack
  })),
  prizeCardsTaken: z.record(z.number()).optional(), // Number of prize cards taken this turn
  newActivePokemonAfterKnockout: z.record(z.string()).optional(), // Maps player ID to their new active Pokémon
  prizeCards: z.array(z.string()).optional(), // List of prize cards taken this turn
});

const processTurns = async (state: typeof MessageState.State) => {
  console.log("Processing turns");
  
  const turns: any = [];
  let turnNumber = 1;
  for (const turn of state.turnBlocks) {
    console.log("Processing turn", turnNumber);
    const messages = [
      new SystemMessage(`You are a Pokèmon TCG Live battle log validation assistant.
The "uploadingPlayer" is ${uploadingPlayer}.
Return the turn as a Turn object.`),
      new HumanMessage(`Here is the turn:\n${turn}`),
    ];
    console.log(messages);

    const response = await agentModel.withStructuredOutput(turnSchema).invoke(messages);
    console.log(response);
    turns.push(response);
    turnNumber++;
  };
  
  console.log(JSON.stringify(turns, null, 2));
};

const workflow = new StateGraph(MessageState)
  .addNode("setupNode", setupNode)
  .addNode("processTurns", processTurns)
  .addEdge(START, "setupNode")
  .addConditionalEdges("setupNode", reflectionNode, {
    Pass: "processTurns",
    Fail: END,
  });

(async function main() {
  const app = workflow.compile();
  const state = await app.invoke({});
  console.log(JSON.stringify(state, null, 2));
})();