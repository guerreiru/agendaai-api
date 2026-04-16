import type { NextFunction, Request, Response } from "express";
import { getCompanyDashboard, getProfessionalMeDashboard } from '../services/dashboard.service.js';
import { AppError } from '../utils/app-error.js';
import { isString } from '../utils/isString.js';

import type { UserRole } from "../types/user.js";
export async function getCompanyDashboardController(
	request: Request,
	response: Response,
	next: NextFunction,
) {
	try {
		if (!request.userId || !request.userRole) {
			throw new AppError("Authentication required.", 401);
		}

		const { companyId } = request.params;
		if (!isString(companyId) || !companyId.trim()) {
			throw new AppError("Company id is required.", 400);
		}

		const summary = await getCompanyDashboard(companyId.trim(), {
			actorId: request.userId,
			actorRole: request.userRole as UserRole,
		});

		return response.status(200).json(summary);
	} catch (error) {
		next(error);
	}
}

export async function getProfessionalMeDashboardController(
	request: Request,
	response: Response,
	next: NextFunction,
) {
	try {
		if (!request.userId || !request.userRole) {
			throw new AppError("Authentication required.", 401);
		}

		const summary = await getProfessionalMeDashboard({
			actorId: request.userId,
			actorRole: request.userRole as UserRole,
		});

		return response.status(200).json(summary);
	} catch (error) {
		next(error);
	}
}
