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
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  listAppointmentsSchema,
  queueSchema,
  availabilitySchema,
} from "../validators/appointment.validator.js";
import { ResponseUtil } from "../utils/response.util.js";

const router = Router();

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: List appointments with optional filters
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema: { type: string, format: date-time }
 *         description: Filter by start time (ISO 8601)
 *       - in: query
 *         name: end
 *         schema: { type: string, format: date-time }
 *         description: Filter by end time (ISO 8601)
 *       - in: query
 *         name: patientId
 *         schema: { type: string, format: uuid }
 *         description: Filter by patient ID
 *     responses:
 *       200:
 *         description: List of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Appointment' } }
 */
router.get(
  "/",
  authenticate,
  requireClinic,
  validate(listAppointmentsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointmentService = container.resolve(AppointmentService);
      const appointments = await appointmentService.listAppointments(
        req.user!.clinic_id!,
        {
          start: req.query.start as string,
          end: req.query.end as string,
          patientId: req.query.patientId as string,
        }
      );
      ResponseUtil.success(res, appointments);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /appointments/queue:
 *   get:
 *     summary: Get appointment queue (for reminder system)
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema: { type: integer, default: 48 }
 *         description: Get appointments for the next N hours
 *       - in: query
 *         name: status
 *         schema: { type: string, default: pending }
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of appointments in queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Appointment' } }
 */
router.get(
  "/queue",
  authenticate,
  requireClinic,
  validate(queueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointmentService = container.resolve(AppointmentService);
      const queue = await appointmentService.getQueue(
        req.user!.clinic_id!,
        Number(req.query.hours) || 48,
        (req.query.status as string) || "pending"
      );
      ResponseUtil.success(res, queue);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, start, end]
 *             properties:
 *               patientId: { type: string, format: uuid }
 *               start: { type: string, format: date-time }
 *               end: { type: string, format: date-time }
 *               durationInMinutes: { type: integer }
 *               isEmergency: { type: boolean }
 *               isFollowUpPending: { type: boolean }
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Appointment' }
 *       409:
 *         description: Time slot is not available
 */
router.post(
  "/",
  authenticate,
  requireClinic,
  validate(createAppointmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointmentService = container.resolve(AppointmentService);
      const appointment = await appointmentService.createAppointment(
        req.user!.clinic_id!,
        req.user!.user_id,
        req.body
      );
      ResponseUtil.created(res, appointment);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /appointments/{id}:
 *   patch:
 *     summary: Update an appointment
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the appointment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [pending, confirm, cancel] }
 *               start: { type: string, format: date-time }
 *               end: { type: string, format: date-time }
 *               durationInMinutes: { type: integer }
 *               didShowUp: { type: boolean }
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Appointment' }
 */
router.patch(
  "/:id",
  authenticate,
  requireClinic,
  validate(updateAppointmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointmentService = container.resolve(AppointmentService);
      const appointment = await appointmentService.updateAppointment(
        req.params.id as string,
        req.user!.clinic_id!,
        req.user!.user_id,
        req.body
      );
      ResponseUtil.success(res, appointment);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
