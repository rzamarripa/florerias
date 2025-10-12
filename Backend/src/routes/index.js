import { Router } from "express";

import chatRoutes from "./chatRoutes.js";
import clientRoutes from "./clientRoutes.js";
import departmentRoutes from "./departmentRoutes.js";
import moduleRoutes from "./moduleRoutes.js";
import pageRoutes from "./pageRoutes.js";
import roleRoutes from "./roleRoutes.js";
import roleVisibilityRoutes from "./roleVisibilityRoutes.js";
import userRoutes from "./userRoutes.js";
import fixIndexesRoutes from "./fixIndexesRoutes.js";
import cashierRoutes from "./cashierRoutes.js";
import productionRoutes from "./productionRoutes.js";
import dealerRoutes from "./dealerRoutes.js";
import managerRoutes from "./managerRoutes.js";
import productRoutes from "./productRoutes.js";
import orderRoutes from "./orderRoutes.js";
import materialRoutes from "./materialRoutes.js";
import unitRoutes from "./unitRoutes.js";
import paymentMethodRoutes from "./paymentMethodRoutes.js";
import companyRoutes from "./companyRoutes.js";
import branchRoutes from "./branchRoutes.js";
import productListRoutes from "./productListRoutes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/clients", clientRoutes);
router.use("/departments", departmentRoutes);
router.use("/roles", roleRoutes);
router.use("/pages", pageRoutes);
router.use("/modules", moduleRoutes);
router.use("/chat", chatRoutes);
router.use("/role-visibility", roleVisibilityRoutes);
router.use("/fix", fixIndexesRoutes);
router.use("/cashiers", cashierRoutes);
router.use("/production", productionRoutes);
router.use("/delivery", dealerRoutes);
router.use("/managers", managerRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/materials", materialRoutes);
router.use("/units", unitRoutes);
router.use("/payment-methods", paymentMethodRoutes);
router.use("/companies", companyRoutes);
router.use("/branches", branchRoutes);
router.use("/product-lists", productListRoutes);

export default router;
