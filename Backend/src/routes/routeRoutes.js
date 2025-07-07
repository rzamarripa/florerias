import express from "express";
import {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getRoutesByBranch,
  getRoutesByBrand,
  getRoutesByCompany,
} from "../controllers/routeController.js";

const router = express.Router();

router.get("/", getAllRoutes);
router.get("/:id", getRouteById);
router.post("/", createRoute);
router.put("/:id", updateRoute);
router.delete("/:id", deleteRoute);

router.get("/branch/:branchId", getRoutesByBranch);
router.get("/brand/:brandId", getRoutesByBrand);
router.get("/company/:companyId", getRoutesByCompany);

export default router; 