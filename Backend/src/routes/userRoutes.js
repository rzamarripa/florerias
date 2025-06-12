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
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.use(protect);

router.route("/").get(getAllUsers);

router
  .route("/:id")
  .get(getUserById)
  .put(updateUser)
  .delete(authorize(["SuperAdmin", "Admin"]), deleteUser);

router.put("/:id/password", changePassword);
router.put("/:id/activate", authorize(["SuperAdmin", "Admin"]), activateUser);
router.put("/:id/role", authorize(["SuperAdmin", "Admin"]), assignRoles);

export default router;
