import type { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";
import { AIService } from "../services/ai.service.js";
import type { CoreMessage } from "ai";

/**
 * AI Controller
 * Handles AI chat requests
 */
export class AIController {
  /**
   * Handle chat stream
   */
  static async chat(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const aiService = container.resolve(AIService);
      const { messages } = req.body as { messages: CoreMessage[] };
      const user = req.user!;

      // Get user's timezone and time info from headers
      const userTimezone = req.headers['x-user-timezone'] as string || 'UTC';
      const userDate = req.headers['x-user-date'] as string;
      const userTime = req.headers['x-user-time'] as string;

      // Get streaming result from AI service
      const result = await aiService.handleChatStream(messages, user, {
        timezone: userTimezone,
        currentDateLocal: userDate,
        currentTimeLocal: userTime,
      });

      // Use pipeDataStreamToResponse for streaming to Express
      result.pipeDataStreamToResponse(res);
    } catch (error: any) {
      console.error("AI chat error:", error);
      console.error("Error stack:", error.stack);
      next(error);
    }
  }
}
