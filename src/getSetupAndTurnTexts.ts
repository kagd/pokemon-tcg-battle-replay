import { AzureOpenAI } from "openai";
import { config } from "./config.js";

export async function getSetupAndTurnTexts(
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