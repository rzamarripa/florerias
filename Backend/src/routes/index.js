import { Router } from "express";

import brandRoutes from "./brandRoutes.js";
import companyRoutes from "./companyRoutes.js";
import moduleRoutes from "./moduleRoutes.js";
import pageRoutes from "./pageRoutes.js";
import roleRoutes from "./roleRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/pages", pageRoutes);
router.use("/modules", moduleRoutes);
router.use("/companies", companyRoutes);
router.use("/brands", brandRoutes);

export default router;
