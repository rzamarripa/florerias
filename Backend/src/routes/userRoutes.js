import express from "express";
import {
  activateUser,
  assignRoles,
  changePassword,
  deleteUser,
  getAllUsers,
  getUserById,
  loginUser,
  registerUser,
  updateUser,
} from "../controllers/userController.js";
import { uploadSingle } from "../middleware/multerUpload.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);

router.post("/register", uploadSingle("image"), registerUser);
router.post("/login", loginUser);

router.put("/:id", uploadSingle("image"), updateUser);
router.put("/:id/password", changePassword);
router.put("/:id/activate", activateUser);
router.put("/:id/role", assignRoles);

router.delete("/:id", deleteUser);

export default router;
