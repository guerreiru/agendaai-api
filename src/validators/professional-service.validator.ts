import type {
	CreateProfessionalServiceBody,
	UpdateProfessionalServiceBody,
} from "../types/professional-service.js";
import { AppError } from '../utils/app-error.js';
import { isString } from '../utils/isString.js';

export function validateCreateProfessionalServiceBody(
	body: unknown,
): CreateProfessionalServiceBody {
	if (typeof body !== "object" || body === null) {
		throw new AppError("Invalid request body.", 400);
	}

	const { professionalId, serviceId, price, isActive } = body as Record<
		string,
		unknown
	>;

	if (!isString(professionalId) || !professionalId.trim()) {
		throw new AppError("The professionalId is required.", 400);
	}

	if (!isString(serviceId) || !serviceId.trim()) {
		throw new AppError("The serviceId is required.", 400);
	}

	if (typeof price !== "number" || price <= 0) {
		throw new AppError("The price must be greater than zero.", 400);
	}

	if (isActive !== undefined && typeof isActive !== "boolean") {
		throw new AppError("The isActive field must be boolean.", 400);
	}

	const data: CreateProfessionalServiceBody = {
		professionalId: professionalId.trim(),
		serviceId: serviceId.trim(),
		price,
	};

	if (isActive !== undefined) {
		data.isActive = isActive;
	}

	return data;
}

export function validateUpdateProfessionalServiceBody(
	body: unknown,
): UpdateProfessionalServiceBody {
	if (typeof body !== "object" || body === null) {
		throw new AppError("Invalid request body.", 400);
	}

	const { professionalId, serviceId, price, isActive } = body as Record<
		string,
		unknown
	>;

	const data: UpdateProfessionalServiceBody = {};

	if (professionalId !== undefined) {
		if (!isString(professionalId) || !professionalId.trim()) {
			throw new AppError("The professionalId cannot be empty.", 400);
		}
		data.professionalId = professionalId.trim();
	}

	if (serviceId !== undefined) {
		if (!isString(serviceId) || !serviceId.trim()) {
			throw new AppError("The serviceId cannot be empty.", 400);
		}
		data.serviceId = serviceId.trim();
	}

	if (price !== undefined) {
		if (typeof price !== "number" || price <= 0) {
			throw new AppError("The price must be greater than zero.", 400);
		}
		data.price = price;
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
