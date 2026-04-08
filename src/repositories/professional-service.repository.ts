import { prisma } from "../lib/prisma.js";
import type {
	CreateProfessionalServiceInput,
	UpdateProfessionalServiceInput,
} from "../types/professional-service.js";

export async function findProfessionalServiceById(id: string) {
	return prisma.professionalService.findUnique({
		where: { id },
	});
}

export async function findProfessionalServiceByProfessionalAndService(
	professionalId: string,
	serviceId: string,
) {
	return prisma.professionalService.findUnique({
		where: {
			professionalId_serviceId: {
				professionalId,
				serviceId,
			},
		},
	});
}

export async function findProfessionalServices() {
	return prisma.professionalService.findMany({
		orderBy: { createdAt: "desc" },
	});
}

export async function findProfessionalServicesByCompany(
	companyId: string,
	serviceId?: string,
	includeInactive = true,
) {
	return prisma.professionalService.findMany({
		where: {
			...(includeInactive ? {} : { isActive: true }),
			...(serviceId ? { serviceId } : {}),
			service: {
				companyId,
			},
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function createProfessionalService(
	data: CreateProfessionalServiceInput,
) {
	return prisma.professionalService.create({
		data,
	});
}

export async function updateProfessionalService(
	id: string,
	data: UpdateProfessionalServiceInput,
) {
	return prisma.professionalService.update({
		where: { id },
		data,
	});
}

export async function deleteProfessionalService(id: string) {
	return prisma.professionalService.delete({
		where: { id },
	});
}
