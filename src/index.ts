import 'dotenv/config'
import { AzureChatOpenAI } from "@langchain/openai";
import { END, MemorySaver, StateGraph, START, Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
// import { getWeather } from "./tools/setupTool.js";
import { join } from 'path';
import { readFileSync } from 'fs';
import { cwd } from 'process';
import { z } from 'zod';

// Define the tools for the agent to use
// const agentTools = [getWeather];
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

// Initialize memory to persist state between graph runs
// const agentCheckpointer = new MemorySaver();
// const agent = createReactAgent({
//   llm: agentModel,
//   tools: agentTools,
//   checkpointSaver: agentCheckpointer,
// });

// // Now it's time to use!
// const agentFinalState = await agent.invoke(
//   { messages: [new HumanMessage("what is the current weather in sf")] },
//   { configurable: { thread_id: "42" } },
// );

// console.log(
//   agentFinalState.messages[agentFinalState.messages.length - 1].content,
// );

// const agentNextState = await agent.invoke(
//   { messages: [new HumanMessage("what about ny")] },
//   { configurable: { thread_id: "42" } },
// );

// console.log(
//   agentNextState.messages[agentNextState.messages.length - 1].content,
// );

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

const outputSchema = z.object({
  setup: setup,
  turnBlocks: z.array(z.string()),
  winner: z.string().describe("The winner of the game."),
});

// Define the top-level State interface
const State = Annotation.Root({
  setup: Annotation<typeof setup>(),
  turnBlocks: Annotation<Array<string>>(),
});
const uploadingPlayer = "gklinsing";
const srcDir = join(cwd(), "src");
const battleFilePath = join(srcDir, "../sampleBattleReplays", "battle.txt");
const battleFile = readFileSync(battleFilePath, "utf-8");

const setupNode = async (state: typeof MessagesAnnotation.State) => {
  const messages = [
      new SystemMessage(`You are a Pokèmon TCG Live battle log parsing assistant.
Gather the opening cards drawn for each player.
Gather which Pokémon are active and on the bench for each player.
The "uploadingPlayer" is ${uploadingPlayer}. The other is the opponent.
Get the turn blocks for each player.`),
      new HumanMessage(`Here is the battle log: ${battleFile}`),
    ];

  const response = await agentModel.withStructuredOutput(outputSchema).invoke(messages);
  return {
    ...state,
    setup: response,
  }
};

const workflow = new StateGraph(State)
  .addNode("setupNode", setupNode)
  // .addNode("reflect", reflectionNode)
  .addEdge(START, "setupNode");

(async function main() {
  const app = workflow.compile();
  const state = await app.invoke({});
  console.log(JSON.stringify(state, null, 2));
})();