import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { container } from "tsyringe";
import { ClinicService } from "../services/clinic.service.js";
import {
  authenticate,
  requireClinic,
  requireOwner,
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  listJoinRequestsSchema,
  approveRejectRequestSchema,
} from "../validators/clinic.validator.js";
import { ResponseUtil } from "../utils/response.util.js";

const router = Router();

/**
 * @swagger
 * /clinic/join-requests:
 *   get:
 *     summary: List join requests (owner only)
 *     tags: [Clinic Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected] }
 *         description: Filter requests by status
 *     responses:
 *       200:
 *         description: List of join requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/ClinicJoinRequest' } }
 */
router.get(
  "/join-requests",
  authenticate,
  requireOwner,
  validate(listJoinRequestsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinicService = container.resolve(ClinicService);
      const requests = await clinicService.listJoinRequests(
        req.user!.user_id,
        req.query.status as any
      );
      ResponseUtil.success(res, requests);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /clinic/join-requests/{id}:
 *   patch:
 *     summary: Approve or reject a join request (owner only)
 *     tags: [Clinic Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the join request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [approved, rejected] }
 *     responses:
 *       200:
 *         description: Request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/ClinicJoinRequest' }
 */
router.patch(
  "/join-requests/:id",
  authenticate,
  requireOwner,
  validate(approveRejectRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinicService = container.resolve(ClinicService);
      const request = await clinicService.approveOrRejectRequest(
        req.params.id as string,
        req.user!.user_id,
        req.body.status
      );
      ResponseUtil.success(res, request);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /clinic/staff:
 *   get:
 *     summary: List all users in my clinic
 *     tags: [Clinic Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of clinic staff
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/User' } }
 */
router.get(
  "/staff",
  authenticate,
  requireClinic,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinicService = container.resolve(ClinicService);
      const staff = await clinicService.listStaff(req.user!.user_id);
      ResponseUtil.success(res, staff);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
