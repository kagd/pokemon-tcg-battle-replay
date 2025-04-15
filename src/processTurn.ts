import { END } from "@langchain/langgraph";
import { MessageState, turnSchema, reflectionSchema } from "./schema.js";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { agentModel } from "./agent.js";

const uploadingPlayer = "gklinsing";

type ProcessTurn = {
  turn: string;
  index: number;
  state: typeof MessageState.State;
  attempt: number;
}

export const processTurnNode = async ({turn, index, state, attempt}: ProcessTurn): Promise<any> => {
  console.log(`Processing turn index ${index}`, `attempt ${attempt}`);
  console.log({turn, index, state, attempt})
  
  const messages = [
    new SystemMessage(`You are a Pokèmon TCG Live battle log parsing assistant.
The "uploadingPlayer" is ${uploadingPlayer}.
Return the turn as a Turn object.`),
    new HumanMessage(`Here is the turn:\n${turn}`),
  ];

  const response = await agentModel.withStructuredOutput(turnSchema).invoke(messages);
  const reflect = await processTurnReflectionNode(turn, response as any);
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
  return processTurnNode({turn, index, state, attempt: attempt + 1});
};

const processTurnReflectionNode = async (turnBlock: string, json: typeof turnSchema) => {
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