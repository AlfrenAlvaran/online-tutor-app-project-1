import rateLimit from "express-rate-limit";
import { ENV } from "../libs/environments.js";

export const enrollRateLimiter = rateLimit({
  windowMs: ENV.rateLimitWindowMs,
  max: ENV.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many request. Please try again later" },
});
