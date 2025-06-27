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
import bankRoutes from "./bankRoutes.js";
import bankAccountRoutes from "./bankAccountRoutes.js";
import expenseConceptRoutes from "./expenseConceptRoutes.js";
import departmentRoutes from "./departmentRoutes.js";
import importedInvoicesRoutes from "./importedInvoicesRoutes.js";
import invoicesPackageRoutes from "./invoicesPackpageRoutes.js";
import invoicesPackageCompanyRoutes from "./invoicesPackpageCompanyRoutes.js";

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
router.use("/expense-concept", expenseConceptRoutes);
router.use("/providers", providerRoutes);
router.use("/departments", departmentRoutes);
router.use("/banks", bankRoutes);
router.use("/bank-accounts", bankAccountRoutes);
router.use("/imported-invoices", importedInvoicesRoutes);
router.use("/invoices-package", invoicesPackageRoutes);
router.use("/invoices-package-company", invoicesPackageCompanyRoutes);

export default router;
