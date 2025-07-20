import express from "express";
import { protect } from "../middleware/auth.js";
import {
    getAll,
    getAllCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    activeCompany
} from "../controllers/companyController.js";

const router = express.Router();

// GET - Obtener todas las razones sociales con paginación
router.get("/", protect, getAll);

// GET - Obtener todas las razones sociales activas
router.get("/all", protect, getAllCompanies);

// POST - Crear nueva razón social
router.post("/", protect, createCompany);

// PUT - Actualizar razón social
router.put("/:id", protect, updateCompany);

// PUT - Activar razón social
router.put("/:id/active", protect, activeCompany);

// DELETE - Desactivar razón social
router.delete("/:id/delete", protect, deleteCompany);

export default router;
