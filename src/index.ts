import { AzureOpenAI } from "openai";
import { readFileSync } from "fs";
import { join } from "path";
import { cwd } from "process";
import { config } from "./config.js";

const srcDir = join(cwd(), "src");

async function main() {
  const client = new AzureOpenAI({ endpoint: config.endpoint, apiKey: config.apiKey, deployment: config.deployment, apiVersion: config.apiVersion });
  const battleFilePath = join(srcDir, "../sampleBattleReplays", "battle.txt");
  const battleFile = readFileSync(battleFilePath, "utf-8");
  const systemPrompt = readFileSync(join(srcDir, "prompts", "systemPrompt.txt"), "utf-8");
  const battleDefinition = readFileSync(join(srcDir, "types", "battleLog.d.ts"), "utf-8");
  const systemPromptReplaced = systemPrompt.replace("{{battleDefinition}}", battleDefinition);
  const userPrompt = `Here is the battle file:\n${battleFile}`;
  
  const response = await client.chat.completions.create({
    messages: [
      { role: "system", content: systemPromptReplaced },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    model: config.modelName,
  });
  
  console.log(`Prompt tokens: ${response.usage?.prompt_tokens}, Completion tokens: ${response.usage?.completion_tokens}, Total tokens: ${response.usage?.total_tokens}`);
  for (const choice of response.choices) {
    console.log(choice.message.content);
  }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});