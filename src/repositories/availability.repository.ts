import { prisma } from "../lib/prisma.js";
import type {
	CreateAvailabilityInput,
	UpdateAvailabilityInput,
} from "../types/availability.js";

export async function findAvailabilityById(id: string) {
	return prisma.availability.findUnique({
		where: { id },
	});
}

export async function findAvailabilitiesByProfessional(professionalId: string) {
	return prisma.availability.findMany({
		where: { professionalId },
		orderBy: { weekday: "asc" },
	});
}

export async function findAvailabilityByProfessionalAndWeekday(
	professionalId: string,
	weekday: number,
) {
	return prisma.availability.findFirst({
		where: {
			professionalId,
			weekday,
		},
		orderBy: { startTime: "asc" },
	});
}

export async function findAvailabilitiesByProfessionalAndWeekday(
	professionalId: string,
	weekday: number,
) {
	return prisma.availability.findMany({
		where: {
			professionalId,
			weekday,
			isActive: true,
		},
		orderBy: { startTime: "asc" },
	});
}

export async function findOverlappingAvailability(
	professionalId: string,
	weekday: number,
	startTime: string,
	endTime: string,
	excludeId?: string,
) {
	return prisma.availability.findFirst({
		where: {
			professionalId,
			weekday,
			isActive: true,
			startTime: { lt: endTime },
			endTime: { gt: startTime },
			...(excludeId ? { NOT: { id: excludeId } } : {}),
		},
	});
}

export async function findAvailabilities() {
	return prisma.availability.findMany({
		orderBy: { createdAt: "desc" },
	});
}

export async function createAvailability(data: CreateAvailabilityInput) {
	return prisma.availability.create({
		data,
	});
}

export async function updateAvailability(
	id: string,
	data: UpdateAvailabilityInput,
) {
	return prisma.availability.update({
		where: { id },
		data,
	});
}

export async function deleteAvailability(id: string) {
	return prisma.availability.delete({
		where: { id },
	});
}
