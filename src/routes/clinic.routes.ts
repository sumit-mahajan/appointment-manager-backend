import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { container } from "tsyringe";
import { ClinicService } from "../services/clinic.service.js";
import { AuthService } from "../services/auth.service.js";
import {
  authenticate,
  requireClinic,
  requireOwner,
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createClinicSchema,
  searchClinicSchema,
  joinClinicSchema,
  listJoinRequestsSchema,
  approveRejectRequestSchema,
} from "../validators/clinic.validator.js";
import { ResponseUtil } from "../utils/response.util.js";

const router = Router();

/**
 * @swagger
 * /clinics/search:
 *   get:
 *     summary: Search for clinics by name
 *     tags: [Clinics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         required: true
 *         description: Clinic name to search for
 *     responses:
 *       200:
 *         description: List of matching clinics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Clinic' } }
 */
router.get(
  "/search",
  authenticate,
  validate(searchClinicSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinicService = container.resolve(ClinicService);
      const clinics = await clinicService.searchClinics(
        req.query.name as string
      );
      ResponseUtil.success(res, clinics);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /clinics:
 *   post:
 *     summary: Create a new clinic
 *     tags: [Clinics]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               contact: { type: string }
 *     responses:
 *       201:
 *         description: Clinic created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Clinic' }
 */
router.post(
  "/",
  authenticate,
  validate(createClinicSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinicService = container.resolve(ClinicService);
      const authService = container.resolve(AuthService);

      // Create clinic
      const clinic = await clinicService.createClinic(
        req.user!.user_id,
        req.body
      );

      // Generate fresh token with updated clinic_id
      const authResult = await authService.generateTokenForUser(req.user!.user_id);

      // Return both clinic and new token
      ResponseUtil.created(res, {
        clinic,
        token: authResult.token,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /clinics/{id}/join:
 *   post:
 *     summary: Request to join a clinic
 *     tags: [Clinics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the clinic to join
 *     responses:
 *       201:
 *         description: Join request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/ClinicJoinRequest' }
 */
router.post(
  "/:id/join",
  authenticate,
  validate(joinClinicSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinicService = container.resolve(ClinicService);
      const request = await clinicService.createJoinRequest(
        req.user!.user_id,
        req.params.id as string
      );
      ResponseUtil.created(res, request);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
