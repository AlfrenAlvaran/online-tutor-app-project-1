import jwt from "jsonwebtoken";
import { ENV } from "../libs/environments.js";

const JWT_SECRET = ENV.secret;
const JWT_EXPIRES_IN = ENV.jwt_expires_in || "7d";
const COOKIE_EXPIRES_DAY = Number(ENV.jwt_cookie_expires_day) || 7;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: ENV.nodeEnv === "production",
    sameSite: "strict", // mitigates CSRF
    maxAge: COOKIE_EXPIRES_DAY * 24 * 60 * 60 * 1000,
  };
}
