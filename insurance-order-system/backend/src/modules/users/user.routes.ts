import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, (req, res) => {
  console.log("me")
})

router.get("/admin-only", authMiddleware, (req, res) => {
  console.log("admin-only")
})

router.get("/staff-or-admin", authMiddleware, (req, res) => {
  console.log("staff-or-admin")
})

export default router;
