import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";

import { ENV } from "./src/libs/environments.js";
import { connect, disconnection } from "./src/libs/database.js";
import authRouter from "./src/routes/authRoute.js";

const app = express();

const PORT = ENV.port;
const NODE_ENV = ENV.nodeEnv;

// middlewares
app.use(helmet());
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(mongoSanitize());
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = mongoSanitize.sanitize(req.body);
  }
  next();
});
app.use(
  cors({
    origin: ENV.frontend || "http://localhost:3000",
    credentials: true,
  }),
);

// routes

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    dbState: mongoose.connection.readyState,
  });
});

// routes
app.use("/v1/api/auth", authRouter); // user routes

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// global error handler

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Database and Server StartUp

mongoose.set("strictQuery", true);

const startServer = async () => {
  await connect();

  const server = app.listen(ENV.port, () => {
    console.log(`Server running on ${NODE_ENV} mode on port ${ENV.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnection();
      console.log("HTTP server closed. Process terminated.");
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

// Catch unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

startServer();

export default app;
