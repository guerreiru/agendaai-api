import {
	createAvailability,
	deleteAvailability,
	findAvailabilities,
	findAvailabilitiesByProfessional,
	findAvailabilityById,
	findOverlappingAvailability,
	updateAvailability,
} from "../repositories/availability.repository.js";
import { findCompanyById } from "../repositories/company.repository.js";
import { findUserById } from "../repositories/user.repository.js";
import type {
	CreateAvailabilityInput,
	UpdateAvailabilityInput,
} from "../types/availability.js";
import type { UserRole } from "../types/user.js";
import { AppError } from "../utils/app-error.js";

function validateTimeFormat(time: string): boolean {
	return /^\d{2}:\d{2}$/.test(time);
}

function validateWeekday(weekday: number): boolean {
	return Number.isInteger(weekday) && weekday >= 0 && weekday <= 6;
}

export type AvailabilityActorContext = {
	actorId: string;
	actorRole: UserRole;
};

async function assertAvailabilityWriteAccess(
	professionalId: string,
	context: AvailabilityActorContext,
) {
	if (context.actorRole === "ADMIN" || context.actorRole === "SUPER_ADMIN") {
		return;
	}

	if (context.actorRole === "PROFESSIONAL") {
		if (context.actorId !== professionalId) {
			throw new AppError("Insufficient permissions.", 403);
		}
		return;
	}

	if (context.actorRole === "COMPANY_OWNER") {
		const professional = await findUserById(professionalId);
		if (!professional) {
			throw new AppError("Professional not found.", 404);
		}

		if (!professional.companyId) {
			throw new AppError("Professional must have a company.", 400);
		}

		const company = await findCompanyById(professional.companyId);
		if (!company) {
			throw new AppError("Company not found.", 404);
		}

		if (company.ownerId !== context.actorId) {
			throw new AppError("Insufficient permissions.", 403);
		}
		return;
	}

	throw new AppError("Insufficient permissions.", 403);
}

async function assertAvailabilityReadAccess(
	professionalId: string,
	context: AvailabilityActorContext,
) {
	await assertAvailabilityWriteAccess(professionalId, context);
}

export async function createProfessionalAvailability(
	input: CreateAvailabilityInput,
	context?: AvailabilityActorContext,
) {
	if (context) {
		await assertAvailabilityWriteAccess(input.professionalId, context);
	}

	const professional = await findUserById(input.professionalId);
	if (!professional) {
		throw new AppError("Professional not found.", 404);
	}

	if (professional.role !== "PROFESSIONAL") {
		throw new AppError("User must have role PROFESSIONAL.", 400);
	}

	if (!validateWeekday(input.weekday)) {
		throw new AppError("Weekday must be between 0 and 6.", 400);
	}

	if (!validateTimeFormat(input.startTime)) {
		throw new AppError("Start time must be in HH:mm format.", 400);
	}

	if (!validateTimeFormat(input.endTime)) {
		throw new AppError("End time must be in HH:mm format.", 400);
	}

	if (input.startTime >= input.endTime) {
		throw new AppError("Start time must be before end time.", 400);
	}

	const overlapping = await findOverlappingAvailability(
		input.professionalId,
		input.weekday,
		input.startTime,
		input.endTime,
	);
	if (overlapping) {
		throw new AppError("Availability period overlaps an existing period.", 409);
	}

	return createAvailability({
		professionalId: input.professionalId,
		weekday: input.weekday,
		startTime: input.startTime,
		endTime: input.endTime,
		isActive: input.isActive ?? true,
	});
}

export async function listProfessionalAvailabilities(professionalId: string) {
	const professional = await findUserById(professionalId);
	if (!professional) {
		throw new AppError("Professional not found.", 404);
	}

	return findAvailabilitiesByProfessional(professionalId);
}

export async function listAllAvailabilities(
	context?: AvailabilityActorContext,
) {
	if (
		context &&
		context.actorRole !== "ADMIN" &&
		context.actorRole !== "SUPER_ADMIN"
	) {
		throw new AppError("Insufficient permissions.", 403);
	}

	return findAvailabilities();
}

export async function getAvailability(
	id: string,
	context?: AvailabilityActorContext,
) {
	if (!id.trim()) {
		throw new AppError("Availability id is required.", 400);
	}

	const availability = await findAvailabilityById(id);
	if (!availability) {
		throw new AppError("Availability not found.", 404);
	}

	if (context) {
		await assertAvailabilityReadAccess(availability.professionalId, context);
	}

	return availability;
}

export async function updateProfessionalAvailability(
	id: string,
	input: UpdateAvailabilityInput,
	context?: AvailabilityActorContext,
) {
	if (!id.trim()) {
		throw new AppError("Availability id is required.", 400);
	}

	const existing = await findAvailabilityById(id);
	if (!existing) {
		throw new AppError("Availability not found.", 404);
	}

	if (context) {
		await assertAvailabilityWriteAccess(existing.professionalId, context);
	}

	const data: UpdateAvailabilityInput = {};

	if (input.weekday !== undefined) {
		if (!validateWeekday(input.weekday)) {
			throw new AppError("Weekday must be between 0 and 6.", 400);
		}
		data.weekday = input.weekday;
	}

	if (input.startTime !== undefined) {
		if (!validateTimeFormat(input.startTime)) {
			throw new AppError("Start time must be in HH:mm format.", 400);
		}
		data.startTime = input.startTime;
	}

	if (input.endTime !== undefined) {
		if (!validateTimeFormat(input.endTime)) {
			throw new AppError("End time must be in HH:mm format.", 400);
		}
		data.endTime = input.endTime;
	}

	if (data.startTime || data.endTime) {
		const startTime = data.startTime ?? existing.startTime;
		const endTime = data.endTime ?? existing.endTime;

		if (startTime >= endTime) {
			throw new AppError("Start time must be before end time.", 400);
		}
	}

	const nextWeekday = data.weekday ?? existing.weekday;
	const nextStartTime = data.startTime ?? existing.startTime;
	const nextEndTime = data.endTime ?? existing.endTime;

	const overlapping = await findOverlappingAvailability(
		existing.professionalId,
		nextWeekday,
		nextStartTime,
		nextEndTime,
		existing.id,
	);

	if (overlapping) {
		throw new AppError("Availability period overlaps an existing period.", 409);
	}

	if (input.isActive !== undefined) {
		data.isActive = input.isActive;
	}

	if (Object.keys(data).length === 0) {
		throw new AppError("At least one field must be provided to update.", 400);
	}

	return updateAvailability(id, data);
}

export async function deleteProfessionalAvailabilityWithContext(
	id: string,
	context?: AvailabilityActorContext,
) {
	if (!id.trim()) {
		throw new AppError("Availability id is required.", 400);
	}

	const existing = await findAvailabilityById(id);
	if (!existing) {
		throw new AppError("Availability not found.", 404);
	}

	if (context) {
		await assertAvailabilityWriteAccess(existing.professionalId, context);
	}

	return deleteAvailability(id);
}

export async function deleteProfessionalAvailability(id: string) {
	if (!id.trim()) {
		throw new AppError("Availability id is required.", 400);
	}

	const existing = await findAvailabilityById(id);
	if (!existing) {
		throw new AppError("Availability not found.", 404);
	}

	return deleteAvailability(id);
}
