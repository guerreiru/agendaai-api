import type { ErrorRequestHandler } from "express";
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (
	error,
	_request,
	response,
	next,
) => {
	if (response.headersSent) {
		return next(error);
	}

	if (error instanceof AppError) {
		return response.status(error.statusCode).json({
			error: error.message,
			...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
		});
	}

	if (error instanceof Error) {
		console.error("Unhandled error:", error);
		return response.status(500).json({
			error: "Internal server error.",
			...(process.env.NODE_ENV === "development"
				? { message: error.message }
				: {}),
		});
	}

	console.error("Unhandled non-error thrown:", error);
	return response.status(500).json({ error: "Internal server error." });
};
