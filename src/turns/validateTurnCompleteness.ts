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
    turnData: PCTGLBattleLog.Turn
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
    console.log({validation})

    if (!validation.isComplete) {
        const errorMessage = `Turn ${turnData.turnNumber} (${turnData.player}'s turn) is missing actions:\n` +
            validation.missingActions.map((action: string) => `- ${action}`).join('\n') +
            `\n\nExplanation: ${validation.explanation}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
}
