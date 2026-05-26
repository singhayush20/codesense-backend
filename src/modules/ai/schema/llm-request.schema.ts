import { z } from 'zod';

export const textContentSchema = z.object({
  type: z.literal('text'),
  text: z.string().min(1).max(100_000),
});

export const llmMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.array(textContentSchema).min(1),
});

export const llmRequestSchema = z.object({
  model: z.string().min(1).max(200),
  messages: z.array(llmMessageSchema).min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(100_000).optional(),
  topP: z.number().min(0).max(1).optional(),
  stream: z.boolean().optional(),
});
