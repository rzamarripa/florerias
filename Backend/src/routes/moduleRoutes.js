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

const router = express.Router();

router
  .route("/")
  .get(getAllModules)
  .post(createModule);

router.get("/role/:roleId", getModulesByRole);
router.get("/page/:pageId", getModulesByPage);

router
  .route("/:id")
  .get(getModuleById)
  .put(updateModule)
  .delete(deleteModule);

router.put("/:id/activate", activateModule);

router.delete("/:id/permanent",deleteModulePermanently);

export default router;
