import { AzureOpenAI } from "openai";
import { config } from "../../config.js";

/**
 * Validates that all actions mentioned in the turn text are represented in the turn data
 * @param client AzureOpenAI client
 * @param turnText Original turn text
 * @param turnData Processed turn data
 * @returns Promise<boolean> True if validation passes, throws error if validation fails
 */
export async function validateTurnCompleteness(
    client: AzureOpenAI,
    turnText: string,
    turnData: PCTGLBattleLog.Turn,
    uploadedPlayer: string,
) {

    const prompt = `You are a Pokémon TCG Live battle log validator.
Compare this turn's text with its JSON representation and verify that ALL actions mentioned in the text are present in the JSON.
The validation should fail if any of these are missing from the JSON:
1. Card draws
2. Card plays (Pokemon, Trainer cards, etc.)
3. Energy attachments
4. Ability uses
5. Attacks and their results
6. Prize cards taken
7. Pokemon movements (retreats, switches)
8. Item/Tool attachments

Return a JSON response in this format:
{
  "isComplete": boolean,
  "missingActions": string[],
  "explanation": string
}

Do not include any other formatting or information in the response.

Whenever cards are drawn and we know the specific cards drawn, assume that they are for the player that uploaded the battle log.
The uploading player is ${uploadedPlayer}.

Please note that the battle log may contain some incorrect information. Here are specific ones to adjust the validation:
When "Iono" is played the battle log will say the player drew cards twice. That is a bug in the battle log that should be corrected in the JSON. The JSON should say that both players drew cards once but we will only know the cards drawn by the uploading player.

Turn text:
${turnText}

Turn JSON:
${JSON.stringify(turnData)}`;

    const response = await client.chat.completions.create({
        messages: [
            { role: "system", content: prompt }
        ],
        temperature: 0.1,
        model: config.modelName,
    });

    const validation = JSON.parse(response.choices[0].message.content || "{}");

    if (!validation.isComplete) {
        const errorMessage = `Turn ${turnData.turnNumber} (${turnData.player}'s turn) is missing actions:\n` +
            validation.missingActions.map((action: string) => `- ${action}`).join('\n') +
            `\n\nExplanation: ${validation.explanation}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
}
