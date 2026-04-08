import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
	const salt = randomBytes(16).toString("hex");
	const derivedKey = scryptSync(password, salt, 64);
	return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string) {
	const [salt, key] = storedHash.split(":");
	if (!salt || !key) {
		return false;
	}

	const derivedKey = scryptSync(password, salt, 64);
	const originalKey = Buffer.from(key, "hex");

	if (derivedKey.length !== originalKey.length) {
		return false;
	}

	return timingSafeEqual(derivedKey, originalKey);
}
