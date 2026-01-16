import express from "express";
import {
  processQuery,
  getChatContext,
  streamChatQuery
} from "../controllers/chatController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// SECURITY FIX: All chat routes now require authentication
router.get("/context", protect, getChatContext);
router.post("/query", protect, processQuery);
router.post("/stream", protect, streamChatQuery);

export default router; 