import { findCompanyById } from "../repositories/company.repository.js";
import {
	createProfessionalService,
	deleteProfessionalService,
	findProfessionalServiceById,
	findProfessionalServiceByProfessionalAndService,
	findProfessionalServices,
	findProfessionalServicesByCompany,
	updateProfessionalService,
} from "../repositories/professional-service.repository.js";
import { findServiceById } from "../repositories/service.repository.js";
import { findUserById } from "../repositories/user.repository.js";
import type {
	CreateProfessionalServiceInput,
	UpdateProfessionalServiceInput,
} from "../types/professional-service.js";
import type { UserRole } from "../types/user.js";
import { AppError } from "../utils/app-error.js";

export type ProfessionalServiceActorContext = {
	actorId: string;
	actorRole: UserRole;
};

async function assertProfessionalServiceWriteAccess(
	professionalId: string,
	context: ProfessionalServiceActorContext,
) {
	if (context.actorRole === "ADMIN" || context.actorRole === "SUPER_ADMIN") {
		return;
	}

	const professional = await findUserById(professionalId);
	if (!professional) {
		throw new AppError("Professional not found.", 404);
	}

	if (context.actorRole === "PROFESSIONAL") {
		if (context.actorId !== professionalId) {
			throw new AppError("Insufficient permissions.", 403);
		}
		return;
	}

	if (context.actorRole === "COMPANY_OWNER") {
		if (!professional.companyId) {
			throw new AppError("Professional must be linked to a company.", 400);
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

async function ensureProfessionalAndServiceMatchCompany(
	professionalId: string,
	serviceId: string,
) {
	const professional = await findUserById(professionalId);
	if (!professional) {
		throw new AppError("Professional not found.", 404);
	}

	if (professional.role !== "PROFESSIONAL") {
		throw new AppError("User must have role PROFESSIONAL.", 400);
	}

	if (!professional.companyId) {
		throw new AppError("Professional must be linked to a company.", 400);
	}

	const service = await findServiceById(serviceId);
	if (!service) {
		throw new AppError("Service not found.", 404);
	}

	if (service.companyId !== professional.companyId) {
		throw new AppError(
			"Professional and service must belong to the same company.",
			400,
		);
	}
}

export async function createProfessionalServiceOffer(
	input: CreateProfessionalServiceInput,
	context: ProfessionalServiceActorContext,
) {
	if (input.price <= 0) {
		throw new AppError("Price must be greater than zero.", 400);
	}

	await assertProfessionalServiceWriteAccess(input.professionalId, context);

	await ensureProfessionalAndServiceMatchCompany(
		input.professionalId,
		input.serviceId,
	);

	const duplicate = await findProfessionalServiceByProfessionalAndService(
		input.professionalId,
		input.serviceId,
	);
	if (duplicate) {
		throw new AppError("Professional service already exists.", 409);
	}

	return createProfessionalService({
		professionalId: input.professionalId,
		serviceId: input.serviceId,
		price: input.price,
		isActive: input.isActive ?? true,
	});
}

export async function listProfessionalServiceOffers(
	context: ProfessionalServiceActorContext,
) {
	if (context.actorRole !== "ADMIN" && context.actorRole !== "SUPER_ADMIN") {
		throw new AppError("Insufficient permissions.", 403);
	}

	return findProfessionalServices();
}

export async function listProfessionalServiceOffersByCompany(
	companyId: string,
	serviceId?: string,
) {
	if (!companyId.trim()) {
		throw new AppError("Company id is required.", 400);
	}

	const company = await findCompanyById(companyId);
	if (!company) {
		throw new AppError("Company not found.", 404);
	}

	if (serviceId) {
		const service = await findServiceById(serviceId);
		if (!service || service.companyId !== companyId) {
			throw new AppError("Service not found for this company.", 404);
		}
	}

	return findProfessionalServicesByCompany(companyId, serviceId, false);
}

export async function getProfessionalServiceOffer(id: string) {
	if (!id.trim()) {
		throw new AppError("Professional service id is required.", 400);
	}

	const offer = await findProfessionalServiceById(id);
	if (!offer) {
		throw new AppError("Professional service not found.", 404);
	}

	return offer;
}

export async function updateProfessionalServiceOffer(
	id: string,
	input: UpdateProfessionalServiceInput,
	context: ProfessionalServiceActorContext,
) {
	if (!id.trim()) {
		throw new AppError("Professional service id is required.", 400);
	}

	const existingOffer = await findProfessionalServiceById(id);
	if (!existingOffer) {
		throw new AppError("Professional service not found.", 404);
	}

	await assertProfessionalServiceWriteAccess(
		existingOffer.professionalId,
		context,
	);

	const data: UpdateProfessionalServiceInput = {};

	const targetProfessionalId =
		input.professionalId ?? existingOffer.professionalId;
	const targetServiceId = input.serviceId ?? existingOffer.serviceId;

	if (input.professionalId !== undefined || input.serviceId !== undefined) {
		await ensureProfessionalAndServiceMatchCompany(
			targetProfessionalId,
			targetServiceId,
		);

		const duplicate = await findProfessionalServiceByProfessionalAndService(
			targetProfessionalId,
			targetServiceId,
		);

		if (duplicate && duplicate.id !== existingOffer.id) {
			throw new AppError("Professional service already exists.", 409);
		}
	}

	if (input.professionalId !== undefined) {
		data.professionalId = input.professionalId;
	}

	if (input.serviceId !== undefined) {
		data.serviceId = input.serviceId;
	}

	if (input.price !== undefined) {
		if (input.price <= 0) {
			throw new AppError("Price must be greater than zero.", 400);
		}
		data.price = input.price;
	}

	if (input.isActive !== undefined) {
		data.isActive = input.isActive;
	}

	if (Object.keys(data).length === 0) {
		throw new AppError("At least one field must be provided to update.", 400);
	}

	return updateProfessionalService(id, data);
}

export async function deleteProfessionalServiceOffer(
	id: string,
	context: ProfessionalServiceActorContext,
) {
	if (!id.trim()) {
		throw new AppError("Professional service id is required.", 400);
	}

	const existingOffer = await findProfessionalServiceById(id);
	if (!existingOffer) {
		throw new AppError("Professional service not found.", 404);
	}

	await assertProfessionalServiceWriteAccess(
		existingOffer.professionalId,
		context,
	);

	return deleteProfessionalService(id);
}
