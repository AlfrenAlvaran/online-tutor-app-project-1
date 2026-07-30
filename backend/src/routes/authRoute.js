import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  loginValidator,
  registerValidator,
} from "../validators/authValidator.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
  getMe,
  login,
  logout,
  register,
  verify,
} from "../controllers/AuthController.js";
import { protect } from "../middlewares/authMiddleware.js";

const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later",
  },
});

authRouter.post("/register", registerValidator, validate, register);
authRouter.post("/login", loginLimiter, loginValidator, validate, login);
authRouter.post('/verify-otp', otpLimiter, verify)
authRouter.post("/logout", logout);
authRouter.get("/me", protect, getMe);

export default authRouter;
