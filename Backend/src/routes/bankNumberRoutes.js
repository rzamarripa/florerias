import express from "express";
import { bankNumberController } from "../controllers/bankNumberController.js";

const router = express.Router();

router.get("/", bankNumberController.getAll);
router.get("/banks", bankNumberController.getBanksForSelect);
router.get("/:id", bankNumberController.getById);
router.post("/", bankNumberController.create);
router.put("/:id", bankNumberController.update);
router.delete("/:id", bankNumberController.delete);

export default router; 