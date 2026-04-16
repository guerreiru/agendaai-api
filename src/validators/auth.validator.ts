import type { LoginBody, RefreshTokenBody } from "../types/auth.js";
import { AppError } from '../utils/app-error.js';
import { isString } from '../utils/isString.js';

export function validateLoginBody(body: unknown): LoginBody {
	if (typeof body !== "object" || body === null) {
		throw new AppError("Invalid request body.", 400);
	}

	const { email, password } = body as Record<string, unknown>;

	if (!isString(email) || !email.trim()) {
		throw new AppError("The email is required.", 400);
	}

	const normalizedEmail = email.trim().toLowerCase();
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
		throw new AppError("The email format is invalid.", 400);
	}

	if (!isString(password) || !password.trim()) {
		throw new AppError("The password is required.", 400);
	}

	return {
		email: normalizedEmail,
		password,
	};
}

export function validateRefreshTokenBody(body: unknown): RefreshTokenBody {
	if (typeof body !== "object" || body === null) {
		return {};
	}

	const { refreshToken } = body as Record<string, unknown>;

	if (refreshToken === undefined) {
		return {};
	}

	if (!isString(refreshToken) || !refreshToken.trim()) {
		throw new AppError("The refreshToken format is invalid.", 400);
	}

	return {
		refreshToken: refreshToken.trim(),
	};
}
