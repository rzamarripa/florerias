import express from "express";
import {
  createStorage,
  getAllStorages,
  getStorageById,
  getStorageByBranch,
  updateStorage,
  addProductsToStorage,
  removeProductsFromStorage,
  updateProductQuantity,
  deactivateStorage,
  activateStorage,
  deleteStorage,
  reserveStock,
  releaseStock,
  checkStorageExists,
  addMaterialsToStorage,
  removeMaterialsFromStorage,
  updateMaterialQuantity,
} from "../controllers/storageController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas GET
router.get("/", getAllStorages);
router.get("/:id", getStorageById);
router.get("/branch/:branchId", getStorageByBranch);
router.get("/check-exists/:branchId", checkStorageExists);

// Rutas POST
router.post("/", createStorage);
router.post("/:id/add-products", addProductsToStorage);
router.post("/:id/remove-products", removeProductsFromStorage);
router.post("/:id/add-materials", addMaterialsToStorage);
router.post("/:id/remove-materials", removeMaterialsFromStorage);
router.post("/:id/reserve-stock", reserveStock);
router.post("/:id/release-stock", releaseStock);

// Rutas PUT
router.put("/:id", updateStorage);
router.put("/:id/update-quantity", updateProductQuantity);
router.put("/:id/update-material-quantity", updateMaterialQuantity);
router.put("/:id/activate", activateStorage);
router.put("/:id/deactivate", deactivateStorage);

// Rutas DELETE
router.delete("/:id", deleteStorage);

export default router;
