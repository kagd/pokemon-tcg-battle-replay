import { AzureOpenAI } from "openai";
import { processOneTurn } from "./processTurn.js";
import { validateTurnCompleteness } from "./validateTurnCompleteness.js";
import { validateTurnStructure } from "./validateTurnStructure.js";

async function processTurnWithRetry(
  client: AzureOpenAI,
  turnText: string,
  turnNumber: number,
  systemPrompt: string,
  battleDefinition: string,
  uploadingPlayer: string
): Promise<PCTGLBattleLog.Turn> {
  let attempts = 0;
  const maxAttempts = 3;
  let lastError: Error | null = null;

  while (attempts < maxAttempts) {
    try {
      const turnData = await processOneTurn(client, turnText, turnNumber, systemPrompt, battleDefinition, uploadingPlayer);
      
      // Validate the turn data structure
      if (!validateTurnStructure(turnData)) {
        throw new Error(`Invalid turn data structure`);
      }
      console.log(`turnData`, JSON.stringify(turnData, null, 2));
      // Validate that all actions from the text are represented in the JSON
      await validateTurnCompleteness(client, turnText, turnData, uploadingPlayer);
      
      return turnData;
    } catch (error) {
      attempts++;
      lastError = error as Error;
      
      if (attempts === maxAttempts) {
        throw new Error(`Failed to process turn ${turnNumber} after ${maxAttempts} attempts. Last error: ${lastError.message}`);
      }
      
      // Wait with exponential backoff before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      console.log(`Retrying turn ${turnNumber} processing, attempt ${attempts + 1}/${maxAttempts}...`);
    }
  }

  // This should never be reached due to the throw in the catch block
  throw new Error('Unexpected end of processTurnWithRetry');
}

export async function processTurns(
    client: AzureOpenAI, 
    turnTexts: string[],
    setupAndOutcomeData: PCTGLBattleLog.BattleLog,
    systemPrompt: string, 
    battleDefinition: string
  ) {
    const turns = [];
    
    // Process each turn individually with retry logic
    for (let i = 0; i < turnTexts.length; i++) {
      console.log(`Processing turn ${i + 1} of ${turnTexts.length}...`);
      const turnData = await processTurnWithRetry(
        client,
        turnTexts[i],
        i + 1,
        systemPrompt,
        battleDefinition,
        setupAndOutcomeData.setup.uploadingPlayer
      );
      
      turns.push(turnData);
    }
    
    // Combine the setup, outcome, and processed turns data
    const completeData = {
      ...setupAndOutcomeData,
      turns
    };
    
    return completeData;
  }