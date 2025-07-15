import express from "express";
import {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getRoutesByCategory,
  getRoutesByBranch,
  getRoutesByBrand,
  getRoutesByCompany,
  getCategoriesForRoutes,
  getCompaniesByCategory,
  getBrandsByCategoryAndCompany,
  getBranchesByCompanyAndBrand,
} from "../controllers/routeController.js";

const router = express.Router();

router.get("/", getAllRoutes);
router.get("/:id", getRouteById);
router.post("/", createRoute);
router.put("/:id", updateRoute);
router.delete("/:id", deleteRoute);

router.get("/category/:categoryId", getRoutesByCategory);
router.get("/branch/:branchId", getRoutesByBranch);
router.get("/brand/:brandId", getRoutesByBrand);
router.get("/company/:companyId", getRoutesByCompany);

// Rutas para selects en cascada
router.get("/selects/categories", getCategoriesForRoutes);
router.get("/selects/companies/category/:categoryId", getCompaniesByCategory);
router.get("/selects/brands/category/:categoryId/company/:companyId", getBrandsByCategoryAndCompany);
router.get("/selects/branches/company/:companyId/brand/:brandId", getBranchesByCompanyAndBrand);

export default router; 