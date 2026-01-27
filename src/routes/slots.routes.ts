import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { container } from "tsyringe";
import { AppointmentService } from "../services/appointment.service.js";
import { authenticate, requireClinic } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { availabilitySchema } from "../validators/appointment.validator.js";
import { ResponseUtil } from "../utils/response.util.js";

const router = Router();

/**
 * @swagger
 * /slots/availability:
 *   get:
 *     summary: Check if a time slot is available
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema: { type: string, format: date-time }
 *         description: Start time to check (ISO 8601)
 *       - in: query
 *         name: end
 *         required: true
 *         schema: { type: string, format: date-time }
 *         description: End time to check (ISO 8601)
 *       - in: query
 *         name: excludeAppointmentId
 *         schema: { type: string, format: uuid }
 *         description: Appointment ID to exclude from conflict check (for rescheduling)
 *     responses:
 *       200:
 *         description: Availability status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     available: { type: boolean }
 */
router.get(
  "/availability",
  authenticate,
  requireClinic,
  validate(availabilitySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointmentService = container.resolve(AppointmentService);
      const result = await appointmentService.checkAvailability(
        req.user!.clinic_id!,
        req.query.start as string,
        req.query.end as string,
        req.query.excludeAppointmentId as string | undefined
      );
      ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
