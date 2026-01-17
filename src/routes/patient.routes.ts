import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { container } from "tsyringe";
import { PatientService } from "../services/patient.service.js";
import { authenticate, requireClinic } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createPatientSchema,
  searchPatientSchema,
} from "../validators/patient.validator.js";
import { ResponseUtil } from "../utils/response.util.js";

const router = Router();

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Search patients in user's clinic
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by name or contact
 *     responses:
 *       200:
 *         description: List of matching patients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Patient' } }
 */
router.get(
  "/",
  authenticate,
  requireClinic,
  validate(searchPatientSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientService = container.resolve(PatientService);
      const patients = await patientService.searchPatients(
        req.user!.clinic_id!,
        req.query.q as string
      );
      ResponseUtil.success(res, patients);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, contact]
 *             properties:
 *               name: { type: string }
 *               contact: { type: string }
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Patient' }
 */
router.post(
  "/",
  authenticate,
  requireClinic,
  validate(createPatientSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientService = container.resolve(PatientService);
      const patient = await patientService.createPatient(
        req.user!.clinic_id!,
        req.user!.user_id,
        req.body
      );
      ResponseUtil.created(res, patient);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
