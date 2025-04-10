import { AzureOpenAI } from "openai";
import { processOneTurn } from "./processTurn.js";

export async function processTurns(
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