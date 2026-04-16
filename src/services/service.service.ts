import { findCompanyById } from '../repositories/company.repository.js';
import {
    createService, deleteService, findServiceById, findServices, findServicesByCompany,
    updateService
} from '../repositories/service.repository.js';
import { AppError } from '../utils/app-error.js';

import type { CreateServiceInput, UpdateServiceInput } from "../types/service.js";
import type { UserRole } from "../types/user.js";
export type ServiceActorContext = {
	actorId: string;
	actorRole: UserRole;
};

function canManageCatalogServices(role: UserRole): boolean {
	return role === "COMPANY_OWNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

async function assertCompanyManagementAccess(
	companyId: string,
	context: ServiceActorContext,
) {
	const company = await findCompanyById(companyId);
	if (!company) {
		throw new AppError("Company not found.", 404);
	}

	if (
		context.actorRole === "COMPANY_OWNER" &&
		company.ownerId !== context.actorId
	) {
		throw new AppError("Insufficient permissions for this company.", 403);
	}

	return company;
}

export async function createCatalogService(
	input: CreateServiceInput,
	context: ServiceActorContext,
) {
	if (!canManageCatalogServices(context.actorRole)) {
		throw new AppError("Insufficient permissions.", 403);
	}

	await assertCompanyManagementAccess(input.companyId, context);

	if (!Number.isInteger(input.duration) || input.duration <= 0) {
		throw new AppError("Service duration must be a positive integer.", 400);
	}

	const data: CreateServiceInput = {
		companyId: input.companyId,
		name: input.name.trim(),
		duration: input.duration,
	};

	if (input.description !== undefined) {
		if (input.description === null) {
			data.description = null;
		}

		if (input.description !== null) {
			const normalizedDescription = input.description.trim();
			if (normalizedDescription) {
				data.description = normalizedDescription;
			}
		}
	}

	return createService(data);
}

export async function listCatalogServices(context: ServiceActorContext) {
	if (context.actorRole !== "ADMIN" && context.actorRole !== "SUPER_ADMIN") {
		throw new AppError("Insufficient permissions.", 403);
	}

	return findServices();
}

export async function listCatalogServicesByCompany(companyId: string) {
	const company = await findCompanyById(companyId);
	if (!company) {
		throw new AppError("Company not found.", 404);
	}

	return findServicesByCompany(companyId);
}

export async function getCatalogService(id: string) {
	const service = await findServiceById(id);
	if (!service) {
		throw new AppError("Service not found.", 404);
	}

	return service;
}

export async function updateCatalogService(
	id: string,
	input: UpdateServiceInput,
	context: ServiceActorContext,
) {
	if (!canManageCatalogServices(context.actorRole)) {
		throw new AppError("Insufficient permissions.", 403);
	}

	const existingService = await findServiceById(id);
	if (!existingService) {
		throw new AppError("Service not found.", 404);
	}

	await assertCompanyManagementAccess(existingService.companyId, context);

	const data: UpdateServiceInput = {};

	if (input.companyId !== undefined) {
		await assertCompanyManagementAccess(input.companyId, context);
		data.companyId = input.companyId;
	}

	if (input.name !== undefined) {
		if (!input.name.trim()) {
			throw new AppError("The service name cannot be empty.", 400);
		}
		data.name = input.name.trim();
	}

	if (input.description !== undefined) {
		if (input.description === null) {
			data.description = null;
		} else {
			const normalizedDescription = input.description.trim();
			data.description = normalizedDescription || null;
		}
	}

	if (input.duration !== undefined) {
		if (!Number.isInteger(input.duration) || input.duration <= 0) {
			throw new AppError("Service duration must be a positive integer.", 400);
		}
		data.duration = input.duration;
	}

	if (Object.keys(data).length === 0) {
		throw new AppError("At least one field must be provided to update.", 400);
	}

	return updateService(id, data);
}

export async function deleteCatalogService(
	id: string,
	context: ServiceActorContext,
) {
	if (!canManageCatalogServices(context.actorRole)) {
		throw new AppError("Insufficient permissions.", 403);
	}

	const existingService = await findServiceById(id);
	if (!existingService) {
		throw new AppError("Service not found.", 404);
	}

	await assertCompanyManagementAccess(existingService.companyId, context);

	return deleteService(id);
}
