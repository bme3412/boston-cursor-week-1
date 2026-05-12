import { createHash, randomBytes } from "crypto";

/** Hash a PIN with a random salt. Returns "salt:hash". */
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(salt + pin)
    .digest("hex");
  return `${salt}:${hash}`;
}

/** Verify a PIN against a stored "salt:hash" string. */
export function verifyPin(pin: string, stored: string): boolean {
  const [salt, expectedHash] = stored.split(":");
  if (!salt || !expectedHash) return false;
  const hash = createHash("sha256")
    .update(salt + pin)
    .digest("hex");
  return hash === expectedHash;
}
