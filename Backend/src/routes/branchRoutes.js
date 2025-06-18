import express from "express";
import {
  activeBranch,
  createBranch,
  deleteBranch,
  getAll,
  getAllBranches,
  updateBranch,
} from "../controllers/branchController.js";

const router = express.Router();

router.get("/", getAllBranches);
router.get("/all", getAll);
router.post("/", createBranch);
router.put("/:id", updateBranch);
router.delete("/:id", deleteBranch);
router.put("/:id/active", activeBranch);

export default router;
