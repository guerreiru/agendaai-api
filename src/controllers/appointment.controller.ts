import type { NextFunction, Request, Response } from "express";
import {
    cancelAppointment, confirmAppointment, createClientAppointment,
    deleteClientAppointmentWithContext, getAppointment, listAppointments, rejectAppointment,
    updateAppointmentStatus
} from '../services/appointment.service.js';
import { AppError } from '../utils/app-error.js';
import { isString } from '../utils/isString.js';
import {
    validateCreateAppointmentBody, validateUpdateAppointmentBody
} from '../validators/appointment.validator.js';

import type { UserRole } from "../types/user.js";
export async function createAppointmentController(
	request: Request,
	response: Response,
	next: NextFunction,
) {
	try {
		if (!request.userId || !request.userRole) {
			throw new AppError("Authentication required.", 401);
		}

		const body = validateCreateAppointmentBody(request.body);
		const appointmentDate = new Date(body.date);

		const appointment = await createClientAppointment(
			{
				companyId: body.companyId,
				clientId: body.clientId,
				professionalId: body.professionalId,
				serviceId: body.serviceId,
				date: appointmentDate,
				startTime: body.startTime,
				endTime: body.endTime,
			},
			{
				actorId: request.userId,
				actorRole: request.userRole as UserRole,
			},
		);
		return response.status(201).json(appointment);
	} catch (error) {
		next(error);
	}
}

export async function listAppointmentsController(
	request: Request,
	response: Response,
	next: NextFunction,
) {
	try {
		if (!request.userId || !request.userRole) {
			throw new AppError("Authentication required.", 401);
		}

		const { startDate, endDate } = request.query;

		const filters: { startDate?: Date; endDate?: Date } = {};
		if (isString(startDate)) {
			filters.startDate = new Date(startDate);
		}
		if (isString(endDate)) {
			filters.endDate = new Date(endDate);
		}

		const appointments = await listAppointments(
			{
				actorId: request.userId,
				actorRole: request.userRole as UserRole,
			},
			filters,
		);
		return response.status(200).json(appointments);
	} catch (error) {
		next(error);
	}
}

export async function getAppointmentController(
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
			throw new AppError("Appointment id is required.", 400);
		}

		const appointment = await getAppointment(id.trim(), {
			actorId: request.userId,
			actorRole: request.userRole as UserRole,
		});
		return response.status(200).json(appointment);
	} catch (error) {
		next(error);
	}
}

export async function updateAppointmentController(
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
			throw new AppError("Appointment id is required.", 400);
		}

		const body = validateUpdateAppointmentBody(request.body);
		const appointment = await updateAppointmentStatus(id.trim(), body, {
			actorId: request.userId,
			actorRole: request.userRole as UserRole,
		});
		return response.status(200).json(appointment);
	} catch (error) {
		next(error);
	}
}

export async function deleteAppointmentController(
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
			throw new AppError("Appointment id is required.", 400);
		}

		const appointment = await deleteClientAppointmentWithContext(id.trim(), {
			actorId: request.userId,
			actorRole: request.userRole as UserRole,
		});
		return response.status(200).json(appointment);
	} catch (error) {
		next(error);
	}
}

export async function confirmAppointmentController(
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
			throw new AppError("Appointment id is required.", 400);
		}

		const appointment = await confirmAppointment(id.trim(), {
			actorId: request.userId,
			actorRole: request.userRole as UserRole,
		});
		return response.status(200).json(appointment);
	} catch (error) {
		next(error);
	}
}

export async function rejectAppointmentController(
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
			throw new AppError("Appointment id is required.", 400);
		}

		const { rejectionReason } = request.body;
		const appointment = await rejectAppointment(
			id.trim(),
			{ rejectionReason },
			{
				actorId: request.userId,
				actorRole: request.userRole as UserRole,
			},
		);
		return response.status(200).json(appointment);
	} catch (error) {
		next(error);
	}
}

export async function cancelAppointmentController(
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
			throw new AppError("Appointment id is required.", 400);
		}

		const { cancelReason } = request.body;
		const appointment = await cancelAppointment(
			id.trim(),
			{ cancelReason },
			{
				actorId: request.userId,
				actorRole: request.userRole as UserRole,
			},
		);
		return response.status(200).json(appointment);
	} catch (error) {
		next(error);
	}
}
