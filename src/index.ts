import { AzureOpenAI } from "openai";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { cwd } from "process";
import { config } from "../config.js";
import { processTurns } from "./processTurns.js";
import { getSetupAndTurnTexts } from "./getSetupAndTurnTexts.js";

const srcDir = join(cwd(), "src");
const outputDir = join(cwd(), "output");

async function main() {
  const client = new AzureOpenAI({ endpoint: config.endpoint, apiKey: config.apiKey, deployment: config.deployment, apiVersion: config.apiVersion });
  const battleFilePath = join(srcDir, "../sampleBattleReplays", "battle.txt");
  const battleFile = readFileSync(battleFilePath, "utf-8");
  const setupPrompt = readFileSync(join(srcDir, "prompts", "systemPrompt.txt"), "utf-8");
  const turnsPrompt = readFileSync(join(srcDir, "prompts", "turnsPrompt.txt"), "utf-8");
  const battleDefinition = readFileSync(join(srcDir, "types", "battleLog.d.ts"), "utf-8");
  
  // Step 1: Get the setup, outcome information, and turn text segments
  console.log("Step 1: Extracting setup, outcome, and turn text segments...");
  const { setupAndOutcomeData, turnTexts } = await getSetupAndTurnTexts(client, battleFile, setupPrompt, battleDefinition);
  
  // Save the initial data to a file
  writeFileSync(join(outputDir, "battle.json"), JSON.stringify(setupAndOutcomeData, null, 2));
  console.log("Initial battle data saved to battle.json");
  
  // Step 2: Process turns one by one
  console.log("Step 2: Processing turns individually...");
  const battleWithTurns = await processTurns(client, turnTexts, setupAndOutcomeData, turnsPrompt, battleDefinition);
  
  // Save the complete battle data with turns
  writeFileSync(join(outputDir, "battle.battle-by-turn.json"), JSON.stringify(battleWithTurns, null, 2));
  console.log("Complete battle data with turns saved to battle.battle-by-turn.json");
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});