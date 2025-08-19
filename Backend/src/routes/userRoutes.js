import express from "express";
import {
  activateUser,
  assignProviders,
  assignRoles,
  changePassword,
  deleteUser,
  getAllUsers,
  getUserById,
  getUserProviders,
  loginUser,
  registerUser,
  removeProvider,
  updateUser,
  updateUserCover,
} from "../controllers/userController.js";
import { uploadSingle } from "../middleware/multerUpload.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);https://www.thunderclient.com/welcome
router.get("/:userId/providers", getUserProviders);

router.post("/register", uploadSingle("image"), registerUser);
router.post("/login", loginUser);

router.put("/:id", uploadSingle("image"), updateUser);
router.put("/:id/password", changePassword);
router.put("/:id/activate", activateUser);
router.put("/:id/role", assignRoles);
router.put("/:userId/providers", assignProviders);
router.put("/:userId/cover", updateUserCover);
router.delete("/:userId/providers/:providerId", removeProvider);

router.delete("/:id", deleteUser);

export default router;
