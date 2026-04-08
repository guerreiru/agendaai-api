import { findCompanyById } from "../repositories/company.repository.js";
import { scheduleExceptionRepository } from "../repositories/schedule-exception.repository.js";
import { findUserById } from "../repositories/user.repository.js";
import type {
	ScheduleExceptionBody,
	ScheduleExceptionResponse,
	UpdateScheduleExceptionBody,
} from "../types/schedule-exception.js";
import type { UserRole } from "../types/user.js";
import { AppError } from "../utils/app-error.js";

export type ScheduleExceptionActorContext = {
	actorId: string;
	actorRole: UserRole;
};

export class ScheduleExceptionService {
	private async assertProfessionalUser(professionalId: string) {
		const professional = await findUserById(professionalId);
		if (!professional) {
			throw new AppError("Professional not found", 404);
		}

		if (professional.role !== "PROFESSIONAL") {
			throw new AppError("User must have role PROFESSIONAL", 400);
		}
	}

	private async assertCanManageProfessional(
		professionalId: string,
		context: ScheduleExceptionActorContext,
	) {
		const professional = await findUserById(professionalId);
		if (!professional) {
			throw new AppError("Professional not found", 404);
		}

		if (context.actorRole === "ADMIN" || context.actorRole === "SUPER_ADMIN") {
			return;
		}

		if (context.actorRole === "PROFESSIONAL") {
			if (professionalId !== context.actorId) {
				throw new AppError("Insufficient permissions", 403);
			}
			return;
		}

		if (context.actorRole === "COMPANY_OWNER") {
			if (!professional.companyId) {
				throw new AppError("Professional must be linked to a company", 400);
			}

			const company = await findCompanyById(professional.companyId);
			if (!company) {
				throw new AppError("Company not found", 404);
			}

			if (company.ownerId !== context.actorId) {
				throw new AppError("Insufficient permissions", 403);
			}
			return;
		}

		throw new AppError("Insufficient permissions", 403);
	}

	async createException(
		professionalId: string,
		body: ScheduleExceptionBody,
		context?: ScheduleExceptionActorContext,
	): Promise<ScheduleExceptionResponse> {
		await this.assertProfessionalUser(professionalId);
		if (context) {
			await this.assertCanManageProfessional(professionalId, context);
		}

		return scheduleExceptionRepository.create(
			professionalId,
			body.type,
			body.startDate,
			body.endDate,
			body.title,
			body.description,
		);
	}

	async getException(
		id: string,
		context?: ScheduleExceptionActorContext,
	): Promise<ScheduleExceptionResponse> {
		const exception = await scheduleExceptionRepository.findById(id);
		if (!exception) {
			throw new AppError("Schedule exception not found", 404);
		}
		if (context) {
			await this.assertCanManageProfessional(exception.professionalId, context);
		}
		return exception;
	}

	async getExceptionsByProfessional(
		professionalId: string,
		context?: ScheduleExceptionActorContext,
	): Promise<ScheduleExceptionResponse[]> {
		await this.assertProfessionalUser(professionalId);
		if (context) {
			await this.assertCanManageProfessional(professionalId, context);
		}

		return scheduleExceptionRepository.findByProfessionalId(professionalId);
	}

	async updateException(
		id: string,
		professionalId: string,
		updates: UpdateScheduleExceptionBody,
		context?: ScheduleExceptionActorContext,
	): Promise<ScheduleExceptionResponse> {
		if (context) {
			await this.assertCanManageProfessional(professionalId, context);
		}
		return scheduleExceptionRepository.update(id, professionalId, updates);
	}

	async deleteException(
		id: string,
		professionalId: string,
		context?: ScheduleExceptionActorContext,
	): Promise<void> {
		if (context) {
			await this.assertCanManageProfessional(professionalId, context);
		}
		await scheduleExceptionRepository.delete(id, professionalId);
	}

	async getExceptionsForDateRange(
		professionalId: string,
		startDate: string,
		endDate: string,
	): Promise<ScheduleExceptionResponse[]> {
		await this.assertProfessionalUser(professionalId);

		return scheduleExceptionRepository.findByProfessionalIdAndDateRange(
			professionalId,
			startDate,
			endDate,
		);
	}
}

export const scheduleExceptionService = new ScheduleExceptionService();
