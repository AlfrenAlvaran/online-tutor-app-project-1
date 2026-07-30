import crypto from "crypto";
import bcrypt from "bcrypt";
import { OTPModel } from "../models/otpModel.js";
import { sendOtpEmail } from "./otpEmailService.js";
const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateCode() {
  const n = crypto.randomInt(0, 10 ** OTP_LENGTH);
  return n.toString().padStart(OTP_LENGTH, "0");
}

export async function createAdminSendOTP(user) {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expireAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OTPModel.findOneAndDelete({ user: user._id });
  await OTPModel.create({ user: user._id, codeHash, expiresAt: expireAt });

  return sendOtpEmail(user, code);
}

export async function verifyOtp(userId, code) {
  const record = await OTPModel.findOne({ user: userId });

  if (!record) {
    return {
      ok: false,
      error: "No pending verification found. Please sign in again.",
    };
  }

  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    return {
      ok: false,
      error: "Code expired. Please sign in again to get a new one.",
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    return {
      ok: false,
      error: "Too many incorrect attempts. Please sign in again.",
    };
  }

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    return { ok: false, error: "Incorrect code. Please try again." };
  }

  await record.deleteOne();
  return { ok: true };
}
