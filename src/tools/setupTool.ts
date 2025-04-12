import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// export const getSetup = tool((input) => {
//   if (['sf', 'san francisco'].includes(input.location.toLowerCase())) {
//     return 'It\'s 60 degrees and foggy.';
//   } else {
//     return 'It\'s 90 degrees and sunny.';
//   }
// }, {
//   name: 'get_setup',
//   description: 'Get the setup for the battle.',
//   schema: z.object({
//     battleLog: z.string().describe("The entire battle log."),
//   })
// })