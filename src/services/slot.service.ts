import type { AppointmentModel } from "../../generated/prisma/models/Appointment.js";
import type { ScheduleExceptionModel } from "../../generated/prisma/models/ScheduleException.js";
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';

import type { GetAvailableSlotsResponse, TimeSlot } from "../types/slot.js";
export class SlotService {
	/**
	 * Get available time slots for a professional to offer a specific service on a given date
	 */
	async getAvailableSlots(
		professionalId: string,
		serviceId: string,
		date: string,
	): Promise<GetAvailableSlotsResponse> {
		const targetDate = this.parseDateOnly(date);
		const weekday = this.getWeekday(targetDate);
		const requestedDateKey = this.toDateKey(targetDate);

		const professional = await prisma.user.findUnique({
			where: { id: professionalId },
		});
		if (!professional) {
			throw new AppError("Professional not found", 404);
		}
		if (professional.role !== "PROFESSIONAL") {
			throw new AppError("User must have role PROFESSIONAL", 400);
		}

		const service = await prisma.service.findUnique({
			where: { id: serviceId },
		});
		if (!service) {
			throw new AppError("Service not found", 404);
		}

		const companyId = professional.companyId;
		if (!companyId || service.companyId !== companyId) {
			throw new AppError(
				"Professional and service must belong to same company",
				400,
			);
		}

		const company = await prisma.company.findUnique({
			where: { id: companyId },
		});
		if (!company) {
			throw new AppError("Company not found", 404);
		}

		const professionalService = await prisma.professionalService.findUnique({
			where: {
				professionalId_serviceId: {
					professionalId,
					serviceId,
				},
			},
		});
		if (!professionalService) {
			throw new AppError("Professional does not offer this service", 404);
		}
		if (!professionalService.isActive) {
			return {
				professionalId,
				serviceId,
				date: requestedDateKey,
				slots: [],
			};
		}

		const availabilities = await prisma.availability.findMany({
			where: {
				professionalId,
				weekday,
				isActive: true,
			},
			orderBy: { startTime: "asc" },
		});

		if (availabilities.length === 0) {
			return {
				professionalId,
				serviceId,
				date: requestedDateKey,
				slots: [],
			};
		}

		const dayStart = new Date(`${requestedDateKey}T00:00:00.000Z`);
		const dayEnd = new Date(`${requestedDateKey}T23:59:59.999Z`);
		const safetyStart = new Date(dayStart);
		safetyStart.setUTCDate(safetyStart.getUTCDate() - 1);
		const safetyEnd = new Date(dayEnd);
		safetyEnd.setUTCDate(safetyEnd.getUTCDate() + 1);

		const exceptions = await prisma.scheduleException.findMany({
			where: {
				professionalId,
				AND: [
					{ startDate: { lte: safetyEnd } },
					{ endDate: { gte: safetyStart } },
				],
			},
		});

		const appointments = await prisma.appointment.findMany({
			where: {
				professionalId,
				date: {
					gte: safetyStart,
					lte: safetyEnd,
				},
				status: {
					in: ["SCHEDULED", "CONFIRMED", "COMPLETED"],
				},
			},
		});

		const slots = this.generateSlots(
			availabilities,
			service.duration,
			exceptions,
			appointments,
			requestedDateKey,
			company.timezone,
		);

		return {
			professionalId,
			serviceId,
			date: requestedDateKey,
			slots,
		};
	}

	private generateSlots(
		availabilities: Array<{ startTime: string; endTime: string }>,
		serviceDurationMinutes: number,
		exceptions: ScheduleExceptionModel[],
		appointments: AppointmentModel[],
		requestedDateKey: string,
		companyTimezone: string,
	): TimeSlot[] {
		const slots: TimeSlot[] = [];
		const slotDurationMinutes = 30;

		for (const availability of availabilities) {
			let currentMinutes = this.timeToMinutes(availability.startTime);
			const endMinutes = this.timeToMinutes(availability.endTime);

			while (currentMinutes + serviceDurationMinutes <= endMinutes) {
				const slotStart = this.minutesToTimeString(currentMinutes);
				const slotEnd = this.minutesToTimeString(
					currentMinutes + serviceDurationMinutes,
				);

				const isAvailable = this.isSlotAvailable(
					slotStart,
					slotEnd,
					exceptions,
					appointments,
					requestedDateKey,
					companyTimezone,
				);

				if (isAvailable) {
					slots.push({
						startTime: slotStart,
						endTime: slotEnd,
						isAvailable: true,
					});
				}

				currentMinutes += slotDurationMinutes;
			}
		}

		return slots;
	}

	private isSlotAvailable(
		slotStart: string,
		slotEnd: string,
		exceptions: ScheduleExceptionModel[],
		appointments: AppointmentModel[],
		requestedDateKey: string,
		companyTimezone: string,
	): boolean {
		const slotStartMinutes = this.timeToMinutes(slotStart);
		const slotEndMinutes = this.timeToMinutes(slotEnd);

		for (const exception of exceptions) {
			if (
				this.exceptionBlocksSlot(
					exception,
					slotStartMinutes,
					slotEndMinutes,
					requestedDateKey,
					companyTimezone,
				)
			) {
				return false;
			}
		}

		for (const appointment of appointments) {
			const appointmentDateKey = this.toDateKey(appointment.date, "UTC");
			if (appointmentDateKey !== requestedDateKey) {
				continue;
			}

			const appStartMinutes = this.timeToMinutes(appointment.startTime);
			const appEndMinutes = this.timeToMinutes(appointment.endTime);

			if (
				this.timesOverlap(
					slotStartMinutes,
					slotEndMinutes,
					appStartMinutes,
					appEndMinutes,
				)
			) {
				return false;
			}
		}

		return true;
	}

	private timesOverlap(
		start1: number,
		end1: number,
		start2: number,
		end2: number,
	): boolean {
		return start1 < end2 && start2 < end1;
	}

	private parseDateOnly(date: string): Date {
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
		if (!match) {
			throw new AppError("Invalid date format", 400);
		}

		const year = Number(match[1]);
		const month = Number(match[2]);
		const day = Number(match[3]);
		const parsed = new Date(Date.UTC(year, month - 1, day));

		if (
			parsed.getUTCFullYear() !== year ||
			parsed.getUTCMonth() !== month - 1 ||
			parsed.getUTCDate() !== day
		) {
			throw new AppError("Invalid date format", 400);
		}

		return parsed;
	}

	private getWeekday(date: Date): number {
		return date.getUTCDay();
	}

	private toDateKey(date: Date, timezone = "UTC"): string {
		const formatter = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});

		const parts = formatter.formatToParts(date);
		const year = parts.find((part) => part.type === "year")?.value;
		const month = parts.find((part) => part.type === "month")?.value;
		const day = parts.find((part) => part.type === "day")?.value;

		if (!year || !month || !day) {
			throw new AppError("Failed to process date", 500);
		}

		return `${year}-${month}-${day}`;
	}

	private getMinutesInTimezone(date: Date, timezone: string): number {
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
		});

		const parts = formatter.formatToParts(date);
		const hour = Number(
			parts.find((part) => part.type === "hour")?.value ?? "0",
		);
		const minute = Number(
			parts.find((part) => part.type === "minute")?.value ?? "0",
		);

		return hour * 60 + minute;
	}

	private timeToMinutes(time: string): number {
		const parts = time.split(":");
		const hours = Number(parts[0]);
		const minutes = Number(parts[1]);
		return hours * 60 + minutes;
	}

	private exceptionBlocksSlot(
		exception: ScheduleExceptionModel,
		slotStartMinutes: number,
		slotEndMinutes: number,
		requestedDateKey: string,
		companyTimezone: string,
	): boolean {
		const exStart = new Date(exception.startDate);
		const exEnd = new Date(exception.endDate);
		const exStartDateKey = this.toDateKey(exStart, companyTimezone);
		const exEndDateKey = this.toDateKey(exEnd, companyTimezone);

		if (requestedDateKey < exStartDateKey || requestedDateKey > exEndDateKey) {
			return false;
		}

		if (exception.type === "BLOCK") {
			return true;
		}

		const breakStart =
			requestedDateKey === exStartDateKey
				? this.getMinutesInTimezone(exStart, companyTimezone)
				: 0;
		const breakEnd =
			requestedDateKey === exEndDateKey
				? this.getMinutesInTimezone(exEnd, companyTimezone)
				: 24 * 60;

		return this.timesOverlap(
			slotStartMinutes,
			slotEndMinutes,
			breakStart,
			breakEnd,
		);
	}

	private minutesToTimeString(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
	}
}

export const slotService = new SlotService();
