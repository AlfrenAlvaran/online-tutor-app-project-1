import NodeCache from "node-cache";
import { ENV } from "../libs/environments.js";

const dedupeCache = new NodeCache({
  stdTTL: ENV.dedupeTtlSeconds,
  checkperiod: Math.max(30, Math.floor(ENV.dedupeTtlSeconds / 2)),
  useClones: false,
});

const templateCache = new NodeCache({
  stdTTL: 60 * 60,
  checkperiod: 600,
  useClones: false,
});

function dedupeKey(email, phone) {
  return `submit:${email}:${phone}`;
}

export function isDuplicateSubmission(email, phone) {
  const key = dedupeKey(email, phone);
  if (dedupeCache.has(key)) return true;
  dedupeCache.set(key, true);
  return false;
}

export function cacheTemplate(key, render) {
  const cached = templateCache.get(key);
  if (cached) return cached;
  const html = render();
  templateCache.set(key, html);
  return html;
}
