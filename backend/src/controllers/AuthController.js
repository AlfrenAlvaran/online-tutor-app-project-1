import { ENV } from "../libs/environments.js";
import UserModel from "../models/UserModel.js";
import { createAdminSendOTP, verifyOtp } from "../services/OtpService.js";
import { cookieOptions, signToken } from "../utils/token.js";
import { signOtpToken, verifyOtpToken } from "../utils/otpToken.js";

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
const ROLES_REQUIRING_OTP = ["admin", "tutor"];

function issueSession(res, user) {
  const token = signToken({ id: user._id });
  res.cookie("token", token, cookieOptions());
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

    if (ROLES_REQUIRING_OTP.includes(user.role)) {
      await createAdminSendOTP(user);

      const token = signOtpToken(user._id.toString());

      return res.status(200).json({
        success: true,
        otpRequired: true,
        otpToken: token,
        message: "A verification code has been sent to your email.",
      });
    }

    issueSession(res, user);

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

export async function verify(req, res, next) {
  try {
    const { otpToken, code } = req.body;

    if (!otpToken || !code) {
      return res
        .status(400)
        .json({ success: false, message: "Missing verification" });
    }

    let payload;
    try {
      payload = verifyOtpToken(otpToken);
    } catch (error) {
      console.error("OTP token verify failed: ", error.message);
      return res.status(401).json({
        success: false,
        message: "Verification session expired. Please sign in again.",
      });
    }

    const user = await UserModel.findById(payload.sub);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Account not found." });
    }

    const result = await verifyOtp(user._id, code);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.error });
    }

    issueSession(res, user);
    return res.status(200).json({
      success: true,
      message: "Logged in",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function resendLoginOtp(req, res, next) {
  try {
    const { otpToken } = req.body;

    if (!otpToken) {
      return res
        .status(400)
        .json({ success: false, message: "Missing verification session." });
    }

    let payload;
    try {
      payload = verifyOtpToken(otpToken);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Verification session expired. Please sign in again.",
      });
    }

    const user = await UserModel.findById(payload.sub);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Account not found." });
    }

    await createAdminSendOTP(user);
    const newOtpToken = signOtpToken(user._id.toString());

    return res.status(200).json({
      success: true,
      otpToken: newOtpToken,
      message: "A new code has been sent to your email.",
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res) {
  return res.status(200).json({ success: true, user: sanitizeUser(req.user) });
}