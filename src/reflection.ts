import { z } from 'zod';

export const reflectionSchema = z.object({
  result: z.enum(["Pass", "Fail"]),
  reason: z.string(),
});