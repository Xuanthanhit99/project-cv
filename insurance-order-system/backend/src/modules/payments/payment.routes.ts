import { Router } from "express";
import {
  createPayment,
  getAllPayments,
  getMyPayments,
  mockPaymentCallback,
} from "./payment.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

router.post("/", authMiddleware, createPayment);

router.get("/my-payments", authMiddleware, getMyPayments);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "STAFF"),
  getAllPayments
);

router.get("/mock-callback", mockPaymentCallback);

export default router;