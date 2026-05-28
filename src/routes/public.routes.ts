import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import rateLimit from "express-rate-limit";
import { container } from "tsyringe";
import { PublicBookingService } from "../services/public-booking.service.js";
import { validate } from "../middleware/validation.middleware.js";
import { publicBookSchema } from "../validators/public.validator.js";
import { ResponseUtil } from "../utils/response.util.js";

const bookRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: "Too many booking requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.get(
  "/clinics",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const service = container.resolve(PublicBookingService);
      const clinics = await service.listClinics();
      ResponseUtil.success(res, clinics);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/clinics/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = container.resolve(PublicBookingService);
      const clinic = await service.getClinicInfo(req.params.id as string);
      ResponseUtil.success(res, clinic);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/book",
  bookRateLimiter,
  validate(publicBookSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = container.resolve(PublicBookingService);
      const appointment = await service.bookAppointment(req.body);
      ResponseUtil.created(res, appointment);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
