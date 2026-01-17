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
  updateUserCover,
} from "../controllers/userController.js";
import { uploadSingle } from "../middleware/multerUpload.js";
import { protect } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/", protect, getAllUsers);
router.get("/:id", protect, getUserById);

router.post("/register", protect, uploadSingle("image"), registerUser);
router.post("/login", authLimiter, loginUser);

router.put("/:id", protect, uploadSingle("image"), updateUser);
router.put("/:id/password", protect, changePassword);
router.put("/:id/activate", protect, activateUser);
router.put("/:id/role", protect, assignRoles);
router.put("/:userId/cover", protect, updateUserCover);

router.delete("/:id", protect, deleteUser);

export default router;
