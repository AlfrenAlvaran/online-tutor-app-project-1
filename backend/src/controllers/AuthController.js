import { ENV } from "../libs/environments.js";
import UserModel from "../models/UserModel.js";
import { cookieOptions, signToken } from "../utils/token.js";

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
      });
    }

    const user = await UserModel.create({ name, email, password });
    const token = signToken({ id: user._id });
    res.cookie("token", token, cookieOptions());
    return res.status(201).json({
      success: true,
      message: "Account created",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).select("+password");

    const invalidCredentials = () =>
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    if (!user) return invalidCredentials();

    if (user.isLocked) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return invalidCredentials();
    }

    await user.resetLoginAttempts();

    const token = signToken({ id: user._id });
    res.cookie("token", token, cookieOptions());

    return res.status(200).json({
      success: true,
      message: "Logged in",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: ENV.nodeEnv === "production",
  });
}

export async function getMe(req, res) {
  return res.status(200).json({ success: true, user: sanitizeUser(req.user) });
}
