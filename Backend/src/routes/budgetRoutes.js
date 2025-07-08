import express from "express";
import {
  calculateParentTotal,
  createBudget,
  deleteBudget,
  getBranchesByCompanyAndBrand,
  getBrandsByCategoryAndCompany,
  getBudgetsByCategory,
  getBudgetsByMonth,
  getCompaniesByCategory,
  getMonthlyBudgetByBranch,
  getRoutesByCompanyBrandAndBranch,
  updateBudget,
} from "../controllers/budgetController.js";

const router = express.Router();

// Endpoints para selects en cascada
router.get("/companies/category/:categoryId", getCompaniesByCategory);
router.get(
  "/brands/category/:categoryId/company/:companyId",
  getBrandsByCategoryAndCompany
);
router.get(
  "/branches/company/:companyId/brand/:brandId",
  getBranchesByCompanyAndBrand
);
router.get(
  "/routes/company/:companyId/brand/:brandId/branch/:branchId",
  getRoutesByCompanyBrandAndBranch
);

// Endpoints existentes
router.get("/month/:month", getBudgetsByMonth);
router.get("/category/:categoryId", getBudgetsByCategory);
router.get("/branch/:branchId/month/:month", getMonthlyBudgetByBranch);
router.get("/total/:parentType/:parentId", calculateParentTotal);

router.post("/", createBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
