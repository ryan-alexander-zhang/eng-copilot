import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const DERIVED_KEY_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 8;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, DERIVED_KEY_LENGTH).toString("hex");

  return `${salt}:${digest}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedDigest] = passwordHash.split(":");

  if (!salt || !storedDigest) {
    return false;
  }

  const derivedDigest = scryptSync(password, salt, DERIVED_KEY_LENGTH);
  const storedBuffer = Buffer.from(storedDigest, "hex");

  if (storedBuffer.length !== derivedDigest.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedDigest);
}

export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isValidPassword(value: string) {
  return value.trim().length >= MIN_PASSWORD_LENGTH;
}
