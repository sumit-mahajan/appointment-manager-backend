import { Router } from "express";
import { AIController } from "../controllers/ai.controller.js";
import { authenticate, requireClinic } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { chatSchema } from "../validators/ai.validator.js";

const router = Router();

/**
 * AI Chat Routes
 */

/**
 * @route   POST /ai/chat
 * @desc    Stream chat responses from AI assistant
 * @access  Private (requires auth & clinic)
 */
router.post("/chat", authenticate, requireClinic, validate(chatSchema), AIController.chat);

export default router;
