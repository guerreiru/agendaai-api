import type { NextFunction, Request, Response } from "express";
import {
	createProfessionalServiceOffer,
	deleteProfessionalServiceOffer,
	getProfessionalServiceOffer,
	listProfessionalServiceOffers,
	listProfessionalServiceOffersByCompany,
	updateProfessionalServiceOffer,
} from "../services/professional-service.service.js";
import type { UserRole } from "../types/user.js";
import { AppError } from "../utils/app-error.js";
import { isString } from "../utils/isString.js";
import {
	validateCreateProfessionalServiceBody,
	validateUpdateProfessionalServiceBody,
} from "../validators/professional-service.validator.js";

export async function createProfessionalServiceController(
	request: Request,
	response: Response,
	next: NextFunction,
) {
	try {
		if (!request.userId || !request.userRole) {
			throw new AppError("Authentication required.", 401);
		}

		const body = validateCreateProfessionalServiceBody(request.body);
		const service = await createProfessionalServiceOffer(body, {
			actorId: request.userId,
			actorRole: request.userRole as UserRole,
		});
		return response.status(201).json(service);
	} catch (error) {
		next(error);
	}
}

export async function listProfessionalServicesController(
	request: Request,
	response: Response,
	next: NextFunction,
) {
	try {
		if (!request.userId || !request.userRole) {
			throw new AppError("Authentication required.", 401);
		}

		const services = await listProfessionalServiceOffers({
			actorId: request.userId,
			actorRole: request.userRole as UserRole,
		});
		return response.status(200).json(services);
	} catch (error) {
		next(error);
	}
}

export async function listCompanyProfessionalServicesController(
	request: Request,
	response: Response,
	next: NextFunction,
) {
	try {
		const { companyId } = request.params;
		if (!isString(companyId) || !companyId.trim()) {
			throw new AppError("Company id is required.", 400);
		}

		const serviceId = request.query.serviceId;
		if (
			serviceId !== undefined &&
			(!isString(serviceId) || !serviceId.trim())
		) {
			throw new AppError("serviceId query must be a non-empty string.", 400);
		}

		const services = await listProfessionalServiceOffersByCompany(
			companyId.trim(),
			isString(serviceId) ? serviceId.trim() : undefined,
		);
		return response.status(200).json(services);
	} catch (error) {
		next(error);
	}
}

export async function getProfessionalServiceController(
	request: Request,
	response: Response,
	next: NextFunction,
) {
	try {
		const { id } = request.params;
		if (!isString(id) || !id.trim()) {
			throw new AppError("Professional service id is required.", 400);
		}

		const service = await getProfessionalServiceOffer(id.trim());
		return response.status(200).json(service);
	} catch (error) {
		next(error);
	}
}

export async function updateProfessionalServiceController(
	request: Request,
	response: Response,
	next: NextFunction,
) {
	try {
		if (!request.userId || !request.userRole) {
			throw new AppError("Authentication required.", 401);
		}

		const { id } = request.params;
		if (!isString(id) || !id.trim()) {
			throw new AppError("Professional service id is required.", 400);
		}

		const body = validateUpdateProfessionalServiceBody(request.body);
		const service = await updateProfessionalServiceOffer(id.trim(), body, {
			actorId: request.userId,
			actorRole: request.userRole as UserRole,
		});
		return response.status(200).json(service);
	} catch (error) {
		next(error);
	}
}

export async function deleteProfessionalServiceController(
	request: Request,
	response: Response,
	next: NextFunction,
) {
	try {
		if (!request.userId || !request.userRole) {
			throw new AppError("Authentication required.", 401);
		}

		const { id } = request.params;
		if (!isString(id) || !id.trim()) {
			throw new AppError("Professional service id is required.", 400);
		}

		const service = await deleteProfessionalServiceOffer(id.trim(), {
			actorId: request.userId,
			actorRole: request.userRole as UserRole,
		});
		return response.status(200).json(service);
	} catch (error) {
		next(error);
	}
}
