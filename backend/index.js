import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import { logger } from "./src/utils/logger.js";
import { corsOrigins, ENV } from "./src/libs/environments.js";
import { connect, disconnection } from "./src/libs/database.js";
import authRouter from "./src/routes/authRoute.js";
import hpp from "hpp";
import { pinoHttp } from "pino-http";
import { notFound } from "./src/middlewares/notFound.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import enrollRouter from "./src/routes/enrollRouter.js";
import programRouter from "./src/routes/programRouter.js";

const app = express();

const PORT = ENV.port;
const NODE_ENV = ENV.nodeEnv;

// middlewares

app.disable("x-powered-by");
app.set("trust-proxy", 1);

app.use(helmet());

app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
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
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["POST", "GET", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use(hpp());
app.use(express.json({ limit: "20kb" }));
app.use(pinoHttp({ logger }));

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
app.use('/v1/api/inquire',enrollRouter );
app.use('/v1/api/programs', programRouter)


// 404 handler
app.use(notFound);
app.use(errorHandler);


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
