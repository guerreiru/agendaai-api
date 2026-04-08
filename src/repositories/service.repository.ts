import { prisma } from "../lib/prisma.js";
import type { CreateServiceInput, UpdateServiceInput } from "../types/service.js";

export async function findServiceById(id: string) {
	return prisma.service.findUnique({
		where: { id },
	});
}

export async function findServices() {
	return prisma.service.findMany({
		orderBy: { createdAt: "desc" },
	});
}

export async function findServicesByCompany(companyId: string) {
	return prisma.service.findMany({
		where: { companyId },
		orderBy: { createdAt: "desc" },
	});
}

export async function createService(data: CreateServiceInput) {
	return prisma.service.create({
		data,
	});
}

export async function updateService(id: string, data: UpdateServiceInput) {
	return prisma.service.update({
		where: { id },
		data,
	});
}

export async function deleteService(id: string) {
	return prisma.service.delete({
		where: { id },
	});
}
