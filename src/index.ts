import 'dotenv/config'
import { StateGraph, START } from "@langchain/langgraph";
import { MessageState } from './schema.js';
import { reflectionSetupNode, setupNode } from './processSetup.js';
import { processTurns, processTurn } from './turn.js';

const workflow = new StateGraph(MessageState)
  .addNode("setupNode", setupNode)
  .addNode("reflectionSetupNode", reflectionSetupNode)
  .addNode("processTurns", processTurns)
  .addNode("processTurn", processTurn, {ends: ["processTurns"]})
  .addEdge(START, "setupNode")
  .addEdge("setupNode", "reflectionSetupNode")
  .addEdge("reflectionSetupNode", "processTurns")
  .addEdge("processTurns", "processTurn");

export const app = workflow.compile();
(async function main() {
  const state = await app.invoke({});
  console.log(JSON.stringify(state, null, 2));
})();