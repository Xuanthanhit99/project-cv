import { Router } from "express";
import { createproduct, getProduct, getProductId, updateProduct } from "./product.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddlware } from "../../middlewares/role.middleware";

const router = Router();

router.get("/", getProduct);
router.get("/:id", getProductId);
router.post("/:id", authMiddleware, roleMiddlware("ADMIN"), createproduct);
router.put("/:id", authMiddleware, roleMiddlware("ADMIN"), updateProduct);
router.delete("/:id", authMiddleware, roleMiddlware("ADMIN"), updateProduct);

export default router;