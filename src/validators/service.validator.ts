import type { CreateServiceBody, UpdateServiceBody } from "../types/service.js";
import { AppError } from '../utils/app-error.js';
import { isString } from '../utils/isString.js';

export function validateCreateServiceBody(body: unknown): CreateServiceBody {
	if (typeof body !== "object" || body === null) {
		throw new AppError("Invalid request body.", 400);
	}

	const { companyId, name, description, duration } = body as Record<
		string,
		unknown
	>;

	if (!isString(companyId) || !companyId.trim()) {
		throw new AppError("The companyId is required.", 400);
	}

	if (!isString(name) || !name.trim()) {
		throw new AppError("The service name is required.", 400);
	}

	if (
		description !== undefined &&
		description !== null &&
		!isString(description)
	) {
		throw new AppError("The description must be a string.", 400);
	}

	if (
		typeof duration !== "number" ||
		!Number.isInteger(duration) ||
		duration <= 0
	) {
		throw new AppError("The duration must be a positive integer.", 400);
	}

	const data: CreateServiceBody = {
		companyId: companyId.trim(),
		name: name.trim(),
		duration,
	};

	if (description !== undefined && description !== null) {
		const normalizedDescription = description.trim();
		if (normalizedDescription) {
			data.description = normalizedDescription;
		}
	}

	return data;
}

export function validateUpdateServiceBody(body: unknown): UpdateServiceBody {
	if (typeof body !== "object" || body === null) {
		throw new AppError("Invalid request body.", 400);
	}

	const { companyId, name, description, duration } = body as Record<
		string,
		unknown
	>;

	const data: UpdateServiceBody = {};

	if (companyId !== undefined) {
		if (!isString(companyId) || !companyId.trim()) {
			throw new AppError("The companyId cannot be empty.", 400);
		}
		data.companyId = companyId.trim();
	}

	if (name !== undefined) {
		if (!isString(name) || !name.trim()) {
			throw new AppError("The service name cannot be empty.", 400);
		}
		data.name = name.trim();
	}

	if (description !== undefined) {
		if (description === null) {
			data.description = null;
		} else if (!isString(description)) {
			throw new AppError("The description must be a string.", 400);
		} else {
			const normalizedDescription = description.trim();
			data.description = normalizedDescription || null;
		}
	}

	if (duration !== undefined) {
		if (
			typeof duration !== "number" ||
			!Number.isInteger(duration) ||
			duration <= 0
		) {
			throw new AppError("The duration must be a positive integer.", 400);
		}
		data.duration = duration;
	}

	if (Object.keys(data).length === 0) {
		throw new AppError("At least one field must be provided to update.", 400);
	}

	return data;
}
