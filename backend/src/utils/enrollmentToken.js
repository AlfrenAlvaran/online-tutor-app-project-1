import crypto from "crypto";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generates a random token for the emailed enrollment link.
 * Only the SHA-256 hash is stored in the DB (same principle as never
 * storing plaintext passwords) — the raw token only ever exists in the
 * email itself and briefly in memory here.
 */
export function generateEnrollmentToken() {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const hashedToken = hashEnrollmentToken(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  return { rawToken, hashedToken, expires };
}

export function hashEnrollmentToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}