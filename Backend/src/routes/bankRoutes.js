import express from "express";
import {
  activeBank,
  createBank,
  deleteBank,
  getAll,
  getAllBanks,
  getById,
  updateBank,
} from "../controllers/bankController.js";

const router = express.Router();

router.get("/", getAllBanks);
router.get("/all", getAll);
router.get("/:id", getById);
router.post("/", createBank);
router.put("/:id", updateBank);
router.delete("/:id", deleteBank);
router.put("/:id/active", activeBank);

export default router;
