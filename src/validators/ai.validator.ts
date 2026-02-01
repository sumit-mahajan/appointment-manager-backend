import { z } from "zod";

/**
 * Validation schemas for AI endpoints
 */

export const chatSchema = z.object({
  body: z.object({
    messages: z.array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    ),
  }),
});

export type ChatInput = z.infer<typeof chatSchema>;
