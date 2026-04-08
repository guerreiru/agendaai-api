import crypto from "node:crypto";

export function hashRefreshToken(token: string): string {
	return crypto.createHash("sha256").update(token).digest("hex");
}

export function getRefreshTokenExpiryDate(): Date {
	const now = new Date();
	now.setDate(now.getDate() + 7);
	return now;
}

export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;
