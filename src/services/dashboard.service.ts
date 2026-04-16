import { findCompanyById } from '../repositories/company.repository.js';
import {
    getCompanyDashboardSummary, getProfessionalDashboardSummary
} from '../repositories/dashboard.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';

import type { UserRole } from "../types/user.js";
export type DashboardActorContext = {
	actorId: string;
	actorRole: UserRole;
};

export async function getCompanyDashboard(
	companyId: string,
	context: DashboardActorContext,
) {
	const company = await findCompanyById(companyId);
	if (!company) {
		throw new AppError("Company not found.", 404);
	}

	const isAdmin =
		context.actorRole === "ADMIN" || context.actorRole === "SUPER_ADMIN";

	if (!isAdmin && context.actorRole === "COMPANY_OWNER") {
		if (company.ownerId !== context.actorId) {
			throw new AppError("Insufficient permissions.", 403);
		}
	}

	if (!isAdmin && context.actorRole !== "COMPANY_OWNER") {
		throw new AppError("Insufficient permissions.", 403);
	}

	return getCompanyDashboardSummary(company.id, company.timezone);
}

export async function getProfessionalMeDashboard(context: DashboardActorContext) {
	if (context.actorRole !== "PROFESSIONAL") {
		throw new AppError("Insufficient permissions.", 403);
	}

	const professional = await findUserById(context.actorId);
	if (!professional) {
		throw new AppError("Professional not found.", 404);
	}

	if (professional.role !== "PROFESSIONAL") {
		throw new AppError("User must have role PROFESSIONAL.", 400);
	}

	if (!professional.companyId) {
		throw new AppError("Professional must be linked to a company.", 400);
	}

	const company = await findCompanyById(professional.companyId);
	if (!company) {
		throw new AppError("Company not found.", 404);
	}

	return getProfessionalDashboardSummary(professional.id, company.timezone);
}
