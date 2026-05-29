import { z } from 'zod';

export const AIReviewCommentSchema = z.object({
  filePath: z.string().describe('The exact file path being evaluated.'),

  line: z
    .number()
    .describe(
      'The exact integer line target matching a newLineNumber from an addition or context line.',
    ),

  severity: z.enum(['CRITICAL', 'WARNING', 'NIT']),

  category: z.enum(['SECURITY', 'LOGIC_BUG', 'PERFORMANCE']),

  message: z
    .string()
    .describe(
      'Clear analysis of the problem and a short markdown code snippet displaying the optimized fix.',
    ),
});

export const AIReviewResponseSchema = z.object({
  summary: z
    .string()
    .describe(
      'A 2-sentence structural summary of overall changes in this batch.',
    ),

  comments: z.array(AIReviewCommentSchema),
});

export type AIReviewComment = z.infer<typeof AIReviewCommentSchema>;

export type AIReviewResponse = z.infer<typeof AIReviewResponseSchema>;
