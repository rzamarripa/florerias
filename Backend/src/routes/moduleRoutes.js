import express from "express";
import {
  activateModule,
  createModule,
  deleteModule,
  deleteModulePermanently,
  getAllModules,
  getModuleById,
  getModulesByPage,
  getModulesByRole,
  updateModule,
} from "../controllers/moduleController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getAllModules)
  .post(authorize(["SuperAdmin", "Admin"]), createModule);

router.get("/role/:roleId", getModulesByRole);
router.get("/page/:pageId", getModulesByPage);

router
  .route("/:id")
  .get(getModuleById)
  .put(authorize(["SuperAdmin", "Admin"]), updateModule)
  .delete(authorize(["SuperAdmin", "Admin"]), deleteModule);

router.put("/:id/activate", authorize(["SuperAdmin", "Admin"]), activateModule);

router.delete(
  "/:id/permanent",
  authorize(["SuperAdmin"]),
  deleteModulePermanently
);

export default router;
