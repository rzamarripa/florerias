import express from "express";
import {
  createStageCatalog,
  getAllStageCatalogs,
  getStageCatalogById,
  updateStageCatalog,
  deactivateStageCatalog,
  activateStageCatalog,
  deleteStageCatalog,
  getUserStages,
} from "../controllers/stageCatalogController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Rutas protegidas con autenticación
// IMPORTANTE: Las rutas específicas deben ir antes de las rutas con parámetros
router.get("/user/stages", protect, getUserStages); // Nueva ruta para pizarrón
router.get("/", protect, getAllStageCatalogs);
router.get("/:id", protect, getStageCatalogById);

router.post("/", protect, createStageCatalog);

router.put("/:id", protect, updateStageCatalog);
router.put("/:id/activate", protect, activateStageCatalog);
router.put("/:id/deactivate", protect, deactivateStageCatalog);

router.delete("/:id", protect, deleteStageCatalog);

export default router;
