import express from "express";
import {
  processQuery,
  getChatContext,
  streamChatQuery
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/context", getChatContext);
router.post("/query", processQuery);
router.post("/stream", streamChatQuery);

export default router; 