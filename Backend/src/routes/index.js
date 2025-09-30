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

export default router;
