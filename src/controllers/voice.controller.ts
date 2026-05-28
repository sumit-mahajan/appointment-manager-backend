import type { Request, Response, NextFunction } from "express";
import { VoiceService } from "../services/voice.service.js";
import { ResponseUtil } from "../utils/response.util.js";

const voiceService = new VoiceService();

export class VoiceController {
  static async transcribe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        ResponseUtil.error(res, "No audio file provided", 400);
        return;
      }

      const { transcript, provider } = await voiceService.transcribe(
        file.buffer,
        file.mimetype
      );

      ResponseUtil.success(res, { transcript, provider });
    } catch (error) {
      next(error);
    }
  }
}
