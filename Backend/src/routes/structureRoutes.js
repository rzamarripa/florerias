import express from "express";
import { getStructureTree } from "../controllers/structureController.js";

const router = express.Router();

router.get("/tree", getStructureTree);

export default router; 