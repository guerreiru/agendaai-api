import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

import {
    createRefreshSession, findActiveRefreshSessionByHash,
    revokeAllRefreshSessionsByUserId as revokeAllRefreshSessionsByUserIdRepository,
    revokeRefreshSessionByHash
} from '../repositories/refresh-session.repository.js';
import { findUserByEmail, findUserById } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';
import { verifyPassword } from '../utils/password.js';
import {
    ACCESS_TOKEN_EXPIRES_IN_SECONDS, getRefreshTokenExpiryDate, hashRefreshToken
} from '../utils/refresh-token.js';

import type { JwtPayload, LoginBody } from "../types/auth.js";
function getRequiredSecret(envName: "JWT_SECRET" | "REFRESH_TOKEN_SECRET") {
	const value = process.env[envName];
	if (value && value.trim().length > 0) {
		return value;
	}

	if (process.env.NODE_ENV === "test") {
		return `test-${envName.toLowerCase()}`;
	}

	throw new Error(`${envName} is required.`);
}

const JWT_SECRET = getRequiredSecret("JWT_SECRET");
const REFRESH_TOKEN_SECRET = getRequiredSecret("REFRESH_TOKEN_SECRET");
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export type AuthTokenPair = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
};

function generateTokenId(): string {
	return crypto.randomUUID();
}

function signAccessToken(payload: JwtPayload): string {
	return jwt.sign(payload, JWT_SECRET, {
		algorithm: "HS256",
		expiresIn: ACCESS_TOKEN_EXPIRY,
	});
}

function signRefreshToken(payload: JwtPayload): string {
	return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
		algorithm: "HS256",
		expiresIn: REFRESH_TOKEN_EXPIRY,
	});
}

export async function login(input: LoginBody): Promise<AuthTokenPair> {
	const user = await findUserByEmail(input.email);

	if (!user) {
		throw new AppError("Invalid email or password.", 401);
	}

	const passwordMatch = verifyPassword(input.password, user.password);

	if (!passwordMatch) {
		throw new AppError("Invalid email or password.", 401);
	}

	const tokenId = generateTokenId();

	const payload: JwtPayload = {
		userId: user.id,
		email: user.email,
		role: user.role,
		tokenId,
	};

	const accessToken = signAccessToken(payload);
	const refreshToken = signRefreshToken(payload);

	await createRefreshSession({
		userId: user.id,
		tokenHash: hashRefreshToken(refreshToken),
		expiresAt: getRefreshTokenExpiryDate(),
	});

	return {
		accessToken,
		refreshToken,
		expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
	};
}

export async function refreshAccessToken(
	refreshToken: string,
): Promise<AuthTokenPair> {
	try {
		const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, {
			algorithms: ["HS256"],
		}) as JwtPayload;

		const session = await findActiveRefreshSessionByHash(
			hashRefreshToken(refreshToken),
		);

		if (!session) {
			throw new AppError("Invalid refresh token.", 401);
		}

		const user = await findUserById(payload.userId);

		if (!user) {
			throw new AppError("Invalid refresh token.", 401);
		}

		await revokeRefreshSessionByHash(hashRefreshToken(refreshToken));

		const tokenId = generateTokenId();

		const newPayload: JwtPayload = {
			userId: user.id,
			email: user.email,
			role: user.role,
			tokenId,
		};

		const newAccessToken = signAccessToken(newPayload);
		const newRefreshToken = signRefreshToken(newPayload);

		await createRefreshSession({
			userId: user.id,
			tokenHash: hashRefreshToken(newRefreshToken),
			expiresAt: getRefreshTokenExpiryDate(),
		});

		return {
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
			expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
		};
	} catch (error) {
		if (
			error instanceof jwt.JsonWebTokenError ||
			error instanceof jwt.TokenExpiredError
		) {
			throw new AppError("Invalid refresh token.", 401);
		}
		throw error;
	}
}

export async function revokeRefreshToken(token: string): Promise<void> {
	await revokeRefreshSessionByHash(hashRefreshToken(token));
}

export async function revokeAllRefreshSessionsByUserId(
	userId: string,
): Promise<void> {
	await revokeAllRefreshSessionsByUserIdRepository(userId);
}

export function isLegacyRefreshBodyEnabled(): boolean {
	const value = process.env.AUTH_ALLOW_LEGACY_REFRESH_BODY;
	if (value === undefined) {
		return false;
	}

	return value.toLowerCase() === "true";
}

export function getRefreshTokenFromLegacyBody(body: unknown): string | null {
	if (typeof body !== "object" || body === null) {
		return null;
	}

	const refreshToken = (body as Record<string, unknown>).refreshToken;
	if (typeof refreshToken !== "string") {
		return null;
	}

	const normalized = refreshToken.trim();
	return normalized.length > 0 ? normalized : null;
}

export function verifyAccessToken(token: string): JwtPayload {
	try {
		const payload = jwt.verify(token, JWT_SECRET, {
			algorithms: ["HS256"],
		}) as JwtPayload;
		return payload;
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			throw new AppError("Access token expired.", 401);
		}
		if (error instanceof jwt.JsonWebTokenError) {
			throw new AppError("Invalid access token.", 401);
		}
		throw error;
	}
}
