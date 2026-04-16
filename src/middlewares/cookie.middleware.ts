import type { NextFunction, Request, Response } from "express";

declare global {
	namespace Express {
		interface Request {
			cookies?: Record<string, string>;
		}
	}
}

function parseCookieHeader(
	cookieHeader: string | undefined,
): Record<string, string> {
	if (!cookieHeader) {
		return {};
	}

	const result: Record<string, string> = {};
	const parts = cookieHeader.split(";");

	for (const part of parts) {
		const [rawName, ...rawValueParts] = part.trim().split("=");
		if (!rawName) {
			continue;
		}

		const rawValue = rawValueParts.join("=");
		try {
			result[decodeURIComponent(rawName)] = decodeURIComponent(rawValue ?? "");
		} catch {
		}
	}

	return result;
}

export function cookieMiddleware(
	request: Request,
	_response: Response,
	next: NextFunction,
) {
	request.cookies = parseCookieHeader(request.headers.cookie);
	next();
}
