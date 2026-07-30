import jwt from "jsonwebtoken";
import { ENV } from "../libs/environments.js";

const OTP_TOKEN_SECRET = ENV.secret;
const OTP_TOKEN_EXPIRES_IN = "10m";

export function signOtpToken(userId) {
  return jwt.sign({ sub: userId, purpose: "otp" }, OTP_TOKEN_SECRET, {
    expiresIn: OTP_TOKEN_EXPIRES_IN,
  });
}

export function verifyOtpToken(token) {
  const payload = jwt.verify(token, OTP_TOKEN_SECRET);

  if (payload.purpose !== "otp") {
    throw new Error("Invalid token purpose");
  }
  return payload;
}
