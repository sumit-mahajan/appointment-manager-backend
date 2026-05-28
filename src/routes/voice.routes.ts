import { Router } from "express";
import multer from "multer";
import { VoiceController } from "../controllers/voice.controller.js";
import { authenticate, requireClinic } from "../middleware/auth.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

/**
 * @route   POST /voice/transcribe
 * @desc    Transcribe audio (Gemini free, Whisper fallback)
 * @access  Private (requires auth & clinic)
 */
router.post(
  "/transcribe",
  authenticate,
  requireClinic,
  upload.single("file"),
  VoiceController.transcribe
);

export default router;
