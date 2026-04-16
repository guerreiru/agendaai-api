import type { NextFunction, Request, Response } from "express";
import { AppError } from '../utils/app-error.js';

export function authOriginMiddleware(
	request: Request,
	_response: Response,
	next: NextFunction,
) {
	if (process.env.NODE_ENV !== "production") {
		return next();
	}

	const frontendOrigin = process.env.FRONTEND_ORIGIN;
	const origin = request.headers.origin;

	if (!frontendOrigin || !origin || origin !== frontendOrigin) {
		return next(new AppError("Invalid request origin.", 403));
	}

	next();
}