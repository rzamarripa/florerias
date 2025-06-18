import { Router } from "express";

import branchRoutes from "./branchRoutes.js";
import brandRoutes from "./brandRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import companyRoutes from "./companyRoutes.js";
import countryRoutes from "./countryRoutes.js";
import expenseConceptCategoryRoutes from "./expenseConceptCategoryRoutes.js";
import moduleRoutes from "./moduleRoutes.js";
import municipalityRoutes from "./municipalityRoutes.js";
import pageRoutes from "./pageRoutes.js";
import providerRoutes from "./providerRoutes.js";
import roleRoutes from "./roleRoutes.js";
import stateRoutes from "./stateRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/pages", pageRoutes);
router.use("/modules", moduleRoutes);
router.use("/companies", companyRoutes);
router.use("/brands", brandRoutes);
router.use("/branches", branchRoutes);
router.use("/categories", categoryRoutes);
router.use("/countries", countryRoutes);
router.use("/states", stateRoutes);
router.use("/municipalities", municipalityRoutes);
router.use("/expense-concept-categories", expenseConceptCategoryRoutes);
router.use("/providers", providerRoutes);

export default router;
