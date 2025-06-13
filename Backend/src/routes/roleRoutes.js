import express from "express";
import {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  updateRole,
} from "../controllers/roleController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllRoles);

router.get("/:id", getRoleById);

router.post("/", authorize(["SuperAdmin", "Admin"]), createRole);

router.put("/:id", authorize(["SuperAdmin", "Admin"]), updateRole);

router.delete("/:id", authorize(["SuperAdmin", "Admin"]), deleteRole);

export default router;
