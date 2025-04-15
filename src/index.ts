import 'dotenv/config'
import { StateGraph, START } from "@langchain/langgraph";
import { MessageState } from './schema.js';
import { processSetupReflectionNode, processSetupNode } from './processSetup.js';
import { processTurnNode } from './processTurn.js';
import { processTurnsNode } from './processTurns.js';

const workflow = new StateGraph(MessageState)
  .addNode("processSetup", processSetupNode)
  .addNode("processSetupReflection", processSetupReflectionNode)
  .addNode("processTurns", processTurnsNode)
  .addNode("processTurn", processTurnNode, {ends: ["processTurns"]})
  .addEdge(START, "processSetup")
  .addEdge("processSetup", "processSetupReflection")
  .addEdge("processSetupReflection", "processTurns")
  .addEdge("processTurns", "processTurn");

export const app = workflow.compile();
// (async function main() {
//   const state = await app.invoke({});
//   console.log(JSON.stringify(state, null, 2));
// })();