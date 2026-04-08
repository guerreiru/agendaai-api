import type { NextFunction, Request, Response } from "express";
import { scheduleExceptionService } from "../services/schedule-exception.service.js";
import type { UserRole } from "../types/user.js";
import { AppError } from "../utils/app-error.js";
import {
	validateCreateScheduleExceptionBody,
	validateUpdateScheduleExceptionBody,
} from "../validators/schedule-exception.js";

export class ScheduleExceptionController {
	async createException(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			if (!req.userId || !req.userRole) {
				throw new AppError("Authentication required", 401);
			}

			const professionalId = req.params.professionalId as string;

			if (!professionalId) {
				throw new AppError("Professional ID is required", 400);
			}

			const body = validateCreateScheduleExceptionBody(req.body);
			const exception = await scheduleExceptionService.createException(
				professionalId,
				body,
				{
					actorId: req.userId,
					actorRole: req.userRole as UserRole,
				},
			);

			res.status(201).json(exception);
		} catch (error) {
			next(error);
		}
	}

	async getException(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			if (!req.userId || !req.userRole) {
				throw new AppError("Authentication required", 401);
			}

			const id = req.params.id as string;

			const exception = await scheduleExceptionService.getException(id, {
				actorId: req.userId,
				actorRole: req.userRole as UserRole,
			});

			res.status(200).json(exception);
		} catch (error) {
			next(error);
		}
	}

	async getExceptionsByProfessional(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			if (!req.userId || !req.userRole) {
				throw new AppError("Authentication required", 401);
			}

			const professionalId = req.params.professionalId as string;

			const exceptions =
				await scheduleExceptionService.getExceptionsByProfessional(
					professionalId,
					{
						actorId: req.userId,
						actorRole: req.userRole as UserRole,
					},
				);

			res.status(200).json(exceptions);
		} catch (error) {
			next(error);
		}
	}

	async updateException(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			if (!req.userId || !req.userRole) {
				throw new AppError("Authentication required", 401);
			}

			const professionalId = req.params.professionalId as string;
			const id = req.params.id as string;

			if (!professionalId) {
				throw new AppError("Professional ID is required", 400);
			}

			const updates = validateUpdateScheduleExceptionBody(req.body);
			const exception = await scheduleExceptionService.updateException(
				id,
				professionalId,
				updates,
				{
					actorId: req.userId,
					actorRole: req.userRole as UserRole,
				},
			);

			res.status(200).json(exception);
		} catch (error) {
			next(error);
		}
	}

	async deleteException(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			if (!req.userId || !req.userRole) {
				throw new AppError("Authentication required", 401);
			}

			const professionalId = req.params.professionalId as string;
			const id = req.params.id as string;

			if (!professionalId) {
				throw new AppError("Professional ID is required", 400);
			}

			await scheduleExceptionService.deleteException(id, professionalId, {
				actorId: req.userId,
				actorRole: req.userRole as UserRole,
			});

			res.status(204).send();
		} catch (error) {
			next(error);
		}
	}
}

export const scheduleExceptionController = new ScheduleExceptionController();
