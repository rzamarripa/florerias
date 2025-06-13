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
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

// Rutas públicas
router.post("/register", upload.single('image'), registerUser);
router.post("/login", loginUser);

// Middleware de autenticación para todas las rutas siguientes
router.use(protect);

// Rutas protegidas
router.route("/").get(getAllUsers);

router
  .route("/:id")
  .get(getUserById)
  .put(upload.single('image'), updateUser)
  .delete(authorize(["SuperAdmin", "Admin"]), deleteUser);

router.put("/:id/password", changePassword);
router.put("/:id/activate", authorize(["SuperAdmin", "Admin"]), activateUser);
router.put("/:id/role", authorize(["SuperAdmin", "Admin"]), assignRoles);

export default router;