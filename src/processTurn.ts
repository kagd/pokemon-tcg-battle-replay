import { AzureOpenAI } from "openai";
import { config } from "./config.js";

export async function processOneTurn(
    client: AzureOpenAI,
    turnText: string,
    turnNumber: number,
    systemPrompt: string,
    battleDefinition: string,
    uploadedPlayer: string,
  ) {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
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
        
        const turnData = JSON.parse(response.choices[0].message.content || "{}");
        return turnData;
      } catch (error) {
        attempts++;
        console.error(`Error processing turn ${turnNumber}, attempt ${attempts}/${maxAttempts}:`, error);
        
        if (attempts === maxAttempts) {
          throw new Error(`Failed to process turn ${turnNumber} after ${maxAttempts} attempts: ${error}`);
        }
        
        // Wait for a short time before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
  }