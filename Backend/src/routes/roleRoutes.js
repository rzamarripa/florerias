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


router.get("/", getAllRoles);

router.get("/:id", getRoleById);

router.post("/", createRole);

router.put("/:id", updateRole);

router.delete("/:id", deleteRole);

export default router;
