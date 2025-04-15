import { Command, END, Send, StateType } from "@langchain/langgraph";
import { MessageState, turnSchema } from "./schema.js";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { agentModel } from "./agent.js";
import { reflectionSchema } from "./reflection.js";

const uploadingPlayer = "gklinsing";

type ProcessTurn = {
  turn: string;
  index: number;
  state: typeof MessageState.State;
  attempt: number;
}

export const processTurns = (state: typeof MessageState.State) => {
  return {
    ...state,
    turnsSent: state.turnBlocks.map(
      (turn, idx) => new Send("processTurn", { turn, index: idx, state, attempt: 1 })
    ),
  }
}

export const processTurn = async ({turn, index, state, attempt}: ProcessTurn): Promise<any> => {
  console.log(`Processing turn index ${index}`, `attempt ${attempt}`);
  console.log({turn, index, state, attempt})
  
  const messages = [
    new SystemMessage(`You are a Pokèmon TCG Live battle log parsing assistant.
The "uploadingPlayer" is ${uploadingPlayer}.
Return the turn as a Turn object.`),
    new HumanMessage(`Here is the turn:\n${turn}`),
  ];

  const response = await agentModel.withStructuredOutput(turnSchema).invoke(messages);
  const reflect = await reflection(turn, response as any);
  if(reflect === 'Pass') {
    return {
      ...state,
      turns: [...state.turns, response],
    };
  }
  if(attempt > 3) {
    console.log("Failed to parse turn after 3 attempts", turn, response);
    return END;
  }
  return processTurn({turn, index, state, attempt: attempt + 1});
};

const reflection = async (turnBlock: string, json: typeof turnSchema) => {
  const messages = [
    new SystemMessage(`You are a Pokèmon TCG Live battle log turn validation assistant.
Verify that all actions, effects, attacks, and outcomes from the turn have been properly parsed.
Check that the turn data is complete and consistent.
Return a pass or fail and a reason for the result.`),
    new AIMessage(`Here is the parsed turn: ${JSON.stringify(json, null, 2)}`),
    new HumanMessage(`Here is the original turn text: ${turnBlock}`),
  ];

  const response = await agentModel.withStructuredOutput(reflectionSchema).invoke(messages);
  return response.result;
};