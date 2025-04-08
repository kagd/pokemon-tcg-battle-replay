import { AzureOpenAI } from "openai";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { cwd } from "process";
import { config } from "./config.js";

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

async function getSetupAndTurnTexts(
  client: AzureOpenAI, 
  battleFile: string, 
  systemPrompt: string, 
  battleDefinition: string
): Promise<{ setupAndOutcomeData: PCTGLBattleLog.BattleLog, turnTexts: string[] }> {
  const prompt = systemPrompt.replace("{{battleDefinition}}", battleDefinition);
  const userPrompt = `Here is the battle file. Please extract:
1. The setup information
2. The outcome information
3. An array of strings where each string is the complete text of a single turn
Return as JSON with properties: setup, outcome, and turnTexts (array of strings)
Battle file:\n${battleFile}`;
  
  const response = await client.chat.completions.create({
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    model: config.modelName,
  });
  
  console.log(`Setup/Outcome/TurnTexts tokens: ${response.usage?.prompt_tokens}, Completion tokens: ${response.usage?.completion_tokens}, Total tokens: ${response.usage?.total_tokens}`);
  
  try {
    const data = JSON.parse(response.choices[0].message.content || "{}");
    const setupAndOutcomeData = {
      setup: data.setup,
      outcome: data.outcome,
      turns: [] // Initialize empty turns array
    };
    return { 
      setupAndOutcomeData,
      turnTexts: data.turnTexts || []
    };
  } catch (error) {
    console.error("Error parsing setup/outcome/turnTexts data:", error);
    throw error;
  }
}

async function processOneTurn(
  client: AzureOpenAI,
  turnText: string,
  turnNumber: number,
  systemPrompt: string,
  battleDefinition: string,
  uploadedPlayer: string,
) {
  const prompt = systemPrompt.replace("{{battleDefinition}}", battleDefinition);
  const userPrompt = `The uploadingPlayer is ${uploadedPlayer}. Please process this single turn and return it as a Turn object:\n${turnText}`;
  
  const response = await client.chat.completions.create({
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    model: config.modelName,
  });
  
  console.log(`Turn ${turnNumber} tokens: ${response.usage?.prompt_tokens}, Completion tokens: ${response.usage?.completion_tokens}, Total tokens: ${response.usage?.total_tokens}`);
  
  try {
    const turnData = JSON.parse(response.choices[0].message.content || "{}");
    return turnData;
  } catch (error) {
    console.error(`Error parsing turn ${turnNumber} data:`, error);
    throw error;
  }
}

async function processTurns(
  client: AzureOpenAI, 
  turnTexts: string[],
  setupAndOutcomeData: PCTGLBattleLog.BattleLog,
  systemPrompt: string, 
  battleDefinition: string
) {
  const turns = [];
  
  // Process each turn individually
  for (let i = 0; i < turnTexts.length; i++) {
    console.log(`Processing turn ${i + 1} of ${turnTexts.length}...`);
    const turnData = await processOneTurn(client, turnTexts[i], i + 1, systemPrompt, battleDefinition, setupAndOutcomeData.setup.uploadingPlayer);
    turns.push(turnData);
  }
  
  // Combine the setup, outcome, and processed turns data
  const completeData = {
    ...setupAndOutcomeData,
    turns
  };
  
  return completeData;
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});