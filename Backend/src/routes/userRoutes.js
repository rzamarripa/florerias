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
  upload,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/register", upload.single('image'), registerUser);
router.post("/login", loginUser);


router.route("/").get(getAllUsers);

router
  .route("/:id")
  .get(getUserById)
  .put(upload.single('image'), updateUser)
  .delete(deleteUser);

router.put("/:id/password", changePassword);
router.put("/:id/activate", activateUser);
router.put("/:id/role",  assignRoles);

export default router;