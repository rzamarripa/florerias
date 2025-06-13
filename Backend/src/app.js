import "dotenv/config";

import cors from "cors";
import express from "express";
import morgan from "morgan";

import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";

import router from "./routes/index.js";

connectDB();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(generalLimiter);

app.use(
  cors({
    origin: "*",
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Server is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use("/api", router);

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

process.on("unhandledRejection", (err, promise) => {
  console.error("❌ Unhandled Promise Rejection:", err.message);
  server.close(() => {
    process.exit(1);
  });
});

const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

export default app;
