import type {
	CreateAvailabilityBody,
	UpdateAvailabilityBody,
} from "../types/availability.js";
import { AppError } from "../utils/app-error.js";
import { isString } from "../utils/isString.js";

export function validateCreateAvailabilityBody(
	body: unknown,
): CreateAvailabilityBody {
	if (typeof body !== "object" || body === null) {
		throw new AppError("Invalid request body.", 400);
	}

	const { professionalId, weekday, startTime, endTime, isActive } =
		body as Record<string, unknown>;

	if (!isString(professionalId) || !professionalId.trim()) {
		throw new AppError("The professionalId is required.", 400);
	}

	if (typeof weekday !== "number" || !Number.isInteger(weekday)) {
		throw new AppError("The weekday must be an integer.", 400);
	}

	if (!isString(startTime) || !startTime.trim()) {
		throw new AppError("The startTime is required.", 400);
	}

	if (!isString(endTime) || !endTime.trim()) {
		throw new AppError("The endTime is required.", 400);
	}

	if (isActive !== undefined && typeof isActive !== "boolean") {
		throw new AppError("The isActive field must be boolean.", 400);
	}

	const data: CreateAvailabilityBody = {
		professionalId: professionalId.trim(),
		weekday,
		startTime: startTime.trim(),
		endTime: endTime.trim(),
	};

	if (isActive !== undefined) {
		data.isActive = isActive;
	}

	return data;
}

export function validateUpdateAvailabilityBody(
	body: unknown,
): UpdateAvailabilityBody {
	if (typeof body !== "object" || body === null) {
		throw new AppError("Invalid request body.", 400);
	}

	const { weekday, startTime, endTime, isActive } = body as Record<
		string,
		unknown
	>;
	const data: UpdateAvailabilityBody = {};

	if (weekday !== undefined) {
		if (typeof weekday !== "number" || !Number.isInteger(weekday)) {
			throw new AppError("The weekday must be an integer.", 400);
		}
		data.weekday = weekday;
	}

	if (startTime !== undefined) {
		if (!isString(startTime) || !startTime.trim()) {
			throw new AppError("The startTime cannot be empty.", 400);
		}
		data.startTime = startTime.trim();
	}

	if (endTime !== undefined) {
		if (!isString(endTime) || !endTime.trim()) {
			throw new AppError("The endTime cannot be empty.", 400);
		}
		data.endTime = endTime.trim();
	}

	if (isActive !== undefined) {
		if (typeof isActive !== "boolean") {
			throw new AppError("The isActive field must be boolean.", 400);
		}
		data.isActive = isActive;
	}

	if (Object.keys(data).length === 0) {
		throw new AppError("At least one field must be provided to update.", 400);
	}

	return data;
}
