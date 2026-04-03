import {
  createAppointment,
  deleteAppointment,
  findAppointmentById,
  findAppointments,
  findConflictingAppointments,
  updateAppointment,
} from "../repositories/appointment.repository";
import { findProfessionalServiceByProfessionalAndService } from "../repositories/professional-service.repository";
import { findUserById } from "../repositories/user.repository";
import { findServiceById } from "../repositories/service.repository";
import { findCompanyById } from "../repositories/company.repository";
import { findAvailabilitiesByProfessionalAndWeekday } from "../repositories/availability.repository";
import { prisma } from "../lib/prisma";
import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentStatus,
} from "../types/appointment";
import type { UserRole } from "../types/user";
import { AppError } from "../utils/app-error";

function timeToMinutes(time: string): number {
  const parts = time.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  return hours * 60 + minutes;
}

function timesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): boolean {
  return start1 < end2 && start2 < end1;
}

function toDateKey(date: Date, timezone = "UTC"): string {
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
    throw new AppError("Failed to process date.", 500);
  }

  return `${year}-${month}-${day}`;
}

function getWeekdayFromDateKey(dateKey: string): number {
  const parts = dateKey.split("-").map(Number);
  const year = parts[0]!;
  const month = parts[1]!;
  const day = parts[2]!;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function getMinutesInTimezone(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );

  return hour * 60 + minute;
}

export type AppointmentActorContext = {
  actorId: string;
  actorRole: UserRole;
};

async function assertCompanyOwnerCanManageCompany(
  companyId: string,
  context: AppointmentActorContext,
) {
  if (context.actorRole !== "COMPANY_OWNER") {
    return;
  }

  const company = await findCompanyById(companyId);
  if (!company) {
    throw new AppError("Company not found.", 404);
  }

  if (company.ownerId !== context.actorId) {
    throw new AppError("Insufficient permissions.", 403);
  }
}

async function assertCanAccessAppointment(
  appointment: { companyId: string; clientId: string; professionalId: string },
  context: AppointmentActorContext,
) {
  if (context.actorRole === "ADMIN" || context.actorRole === "SUPER_ADMIN") {
    return;
  }

  if (context.actorRole === "CLIENT") {
    if (appointment.clientId !== context.actorId) {
      throw new AppError("Insufficient permissions.", 403);
    }
    return;
  }

  if (context.actorRole === "PROFESSIONAL") {
    if (appointment.professionalId !== context.actorId) {
      throw new AppError("Insufficient permissions.", 403);
    }
    return;
  }

  if (context.actorRole === "COMPANY_OWNER") {
    await assertCompanyOwnerCanManageCompany(appointment.companyId, context);
    return;
  }

  throw new AppError("Insufficient permissions.", 403);
}

function assertCanTransitionAppointmentStatus(
  existing: {
    status: AppointmentStatus;
    clientId: string;
    professionalId: string;
  },
  nextStatus: AppointmentStatus,
  context: AppointmentActorContext,
) {
  if (context.actorRole === "ADMIN" || context.actorRole === "SUPER_ADMIN") {
    return;
  }

  const terminalStatuses: AppointmentStatus[] = [
    "CANCELLED",
    "COMPLETED",
    "NO_SHOW",
    "REJECTED",
  ];

  if (terminalStatuses.includes(existing.status)) {
    throw new AppError(
      "Cannot change status of an appointment that is already finalized.",
      400,
    );
  }

  const restrictedToDedicatedEndpoints: AppointmentStatus[] = [
    "CONFIRMED",
    "REJECTED",
    "PENDING_CLIENT_CONFIRMATION",
    "PENDING_PROFESSIONAL_CONFIRMATION",
  ];

  if (restrictedToDedicatedEndpoints.includes(nextStatus)) {
    throw new AppError(
      "Use dedicated confirmation/rejection endpoints for this status transition.",
      403,
    );
  }

  if (context.actorRole === "CLIENT") {
    if (existing.clientId !== context.actorId || nextStatus !== "CANCELLED") {
      throw new AppError("Insufficient permissions.", 403);
    }
    return;
  }

  if (context.actorRole === "PROFESSIONAL") {
    const professionalAllowedStatuses: AppointmentStatus[] = [
      "CANCELLED",
      "COMPLETED",
      "NO_SHOW",
    ];
    if (
      existing.professionalId !== context.actorId ||
      !professionalAllowedStatuses.includes(nextStatus)
    ) {
      throw new AppError("Insufficient permissions.", 403);
    }
    return;
  }

  if (context.actorRole === "COMPANY_OWNER") {
    const ownerAllowedStatuses: AppointmentStatus[] = [
      "CANCELLED",
      "COMPLETED",
      "NO_SHOW",
    ];
    if (!ownerAllowedStatuses.includes(nextStatus)) {
      throw new AppError("Insufficient permissions.", 403);
    }
    return;
  }

  throw new AppError("Insufficient permissions.", 403);
}

export async function createClientAppointment(
  input: Omit<
    CreateAppointmentInput,
    "price" | "createdByRole" | "createdByUserId"
  >,
  context?: AppointmentActorContext,
) {
  if (context?.actorRole === "CLIENT") {
    if (input.clientId !== context.actorId) {
      throw new AppError(
        "Client can only create appointments for themselves.",
        403,
      );
    }
  }

  if (context?.actorRole === "PROFESSIONAL") {
    if (input.professionalId !== context.actorId) {
      throw new AppError(
        "Professional can only create appointments for their own schedule.",
        403,
      );
    }
  }

  if (context?.actorRole === "COMPANY_OWNER") {
    await assertCompanyOwnerCanManageCompany(input.companyId, context);
  }

  const client = await findUserById(input.clientId);
  if (!client) {
    throw new AppError("Client not found.", 404);
  }

  if (client.role !== "CLIENT") {
    throw new AppError("User must have role CLIENT.", 400);
  }

  const professional = await findUserById(input.professionalId);
  if (!professional) {
    throw new AppError("Professional not found.", 404);
  }

  if (professional.role !== "PROFESSIONAL") {
    throw new AppError("Professional user must have role PROFESSIONAL.", 400);
  }

  const service = await findServiceById(input.serviceId);
  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  const company = await findCompanyById(input.companyId);
  if (!company) {
    throw new AppError("Company not found.", 404);
  }

  if (service.companyId !== input.companyId) {
    throw new AppError("Service must belong to the company.", 400);
  }

  if (professional.companyId !== input.companyId) {
    throw new AppError("Professional must work for the company.", 400);
  }

  const professionalService =
    await findProfessionalServiceByProfessionalAndService(
      input.professionalId,
      input.serviceId,
    );

  if (!professionalService) {
    throw new AppError("Professional does not offer this service.", 404);
  }

  if (!professionalService.isActive) {
    throw new AppError(
      "This service is not available with this professional.",
      400,
    );
  }

  const appointmentDate = new Date(input.date);
  if (isNaN(appointmentDate.getTime())) {
    throw new AppError("Invalid date format.", 400);
  }

  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(input.startTime) || !timeRegex.test(input.endTime)) {
    throw new AppError("Start time and end time must be in HH:mm format.", 400);
  }

  if (input.startTime >= input.endTime) {
    throw new AppError("Start time must be before end time.", 400);
  }

  const durationMinutes =
    timeToMinutes(input.endTime) - timeToMinutes(input.startTime);
  if (durationMinutes !== service.duration) {
    throw new AppError(
      "Appointment duration must match service duration.",
      400,
    );
  }

  const dateKey = toDateKey(appointmentDate, "UTC");
  const weekday = getWeekdayFromDateKey(dateKey);
  const activeAvailabilities = await findAvailabilitiesByProfessionalAndWeekday(
    input.professionalId,
    weekday,
  );

  const slotFitsAvailability = activeAvailabilities.some((availability) => {
    return (
      availability.startTime <= input.startTime &&
      input.endTime <= availability.endTime
    );
  });

  if (!slotFitsAvailability) {
    throw new AppError(
      "Selected time is outside professional availability.",
      400,
    );
  }

  const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateKey}T23:59:59.999Z`);
  const safetyStart = new Date(dayStart);
  safetyStart.setUTCDate(safetyStart.getUTCDate() - 1);
  const safetyEnd = new Date(dayEnd);
  safetyEnd.setUTCDate(safetyEnd.getUTCDate() + 1);

  const exceptions = await prisma.scheduleException.findMany({
    where: {
      professionalId: input.professionalId,
      AND: [
        { startDate: { lte: safetyEnd } },
        { endDate: { gte: safetyStart } },
      ],
    },
  });

  const slotStartMinutes = timeToMinutes(input.startTime);
  const slotEndMinutes = timeToMinutes(input.endTime);

  for (const exception of exceptions) {
    const exceptionStart = new Date(exception.startDate);
    const exceptionEnd = new Date(exception.endDate);
    const exceptionStartDateKey = toDateKey(exceptionStart, company.timezone);
    const exceptionEndDateKey = toDateKey(exceptionEnd, company.timezone);

    if (dateKey < exceptionStartDateKey || dateKey > exceptionEndDateKey) {
      continue;
    }

    if (exception.type === "BLOCK") {
      throw new AppError(
        "Selected time is blocked by schedule exception.",
        409,
      );
    }

    const breakStart =
      dateKey === exceptionStartDateKey
        ? getMinutesInTimezone(exceptionStart, company.timezone)
        : 0;
    const breakEnd =
      dateKey === exceptionEndDateKey
        ? getMinutesInTimezone(exceptionEnd, company.timezone)
        : 24 * 60;

    if (timesOverlap(slotStartMinutes, slotEndMinutes, breakStart, breakEnd)) {
      throw new AppError(
        "Selected time is blocked by schedule exception.",
        409,
      );
    }
  }

  const normalizedDate = new Date(`${dateKey}T00:00:00.000Z`);

  const conflicts = await findConflictingAppointments(
    input.professionalId,
    normalizedDate,
    input.startTime,
    input.endTime,
  );

  if (conflicts.length > 0) {
    throw new AppError("Time slot is not available.", 409);
  }

  // Determine status and pending approval based on creator and company settings
  let appointmentStatus: AppointmentStatus = "SCHEDULED";
  let pendingApprovalFrom: UserRole | null = null;

  if (context?.actorRole === "CLIENT") {
    // Client creates for themselves
    if (company.autoConfirm) {
      appointmentStatus = "CONFIRMED";
    } else {
      appointmentStatus = "PENDING_PROFESSIONAL_CONFIRMATION";
      pendingApprovalFrom = "PROFESSIONAL";
    }
  } else if (
    context?.actorRole === "PROFESSIONAL" ||
    context?.actorRole === "ADMIN" ||
    context?.actorRole === "COMPANY_OWNER" ||
    context?.actorRole === "SUPER_ADMIN"
  ) {
    // Internal user creates: requires client confirmation
    appointmentStatus = "PENDING_CLIENT_CONFIRMATION";
    pendingApprovalFrom = "CLIENT";
  }

  return createAppointment({
    companyId: input.companyId,
    clientId: input.clientId,
    professionalId: input.professionalId,
    serviceId: input.serviceId,
    date: normalizedDate,
    startTime: input.startTime,
    endTime: input.endTime,
    price: professionalService.price,
    status: appointmentStatus,
    pendingApprovalFrom,
    createdByRole: context?.actorRole || "CLIENT",
    createdByUserId: context?.actorId || input.clientId,
  });
}

export async function listAppointments(context?: AppointmentActorContext) {
  if (!context) {
    return findAppointments();
  }

  if (context.actorRole === "ADMIN" || context.actorRole === "SUPER_ADMIN") {
    return findAppointments();
  }

  if (context.actorRole === "CLIENT") {
    return prisma.appointment.findMany({
      where: { clientId: context.actorId },
      orderBy: { date: "desc" },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        professional: {
          select: { id: true, name: true, email: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });
  }

  if (context.actorRole === "PROFESSIONAL") {
    return prisma.appointment.findMany({
      where: { professionalId: context.actorId },
      orderBy: { date: "desc" },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        professional: {
          select: { id: true, name: true, email: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });
  }

  if (context.actorRole === "COMPANY_OWNER") {
    return prisma.appointment.findMany({
      where: {
        company: {
          ownerId: context.actorId,
        },
      },
      orderBy: { date: "desc" },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        professional: {
          select: { id: true, name: true, email: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });
  }

  throw new AppError("Insufficient permissions.", 403);
}

export async function getAppointment(
  id: string,
  context?: AppointmentActorContext,
) {
  if (!id.trim()) {
    throw new AppError("Appointment id is required.", 400);
  }

  const appointment = await findAppointmentById(id);
  if (!appointment) {
    throw new AppError("Appointment not found.", 404);
  }

  if (context) {
    await assertCanAccessAppointment(appointment, context);
  }

  return appointment;
}

export async function updateAppointmentStatus(
  id: string,
  input: UpdateAppointmentInput,
  context?: AppointmentActorContext,
) {
  if (!id.trim()) {
    throw new AppError("Appointment id is required.", 400);
  }

  const existing = await findAppointmentById(id);
  if (!existing) {
    throw new AppError("Appointment not found.", 404);
  }

  if (context) {
    await assertCanAccessAppointment(existing, context);
  }

  const data: UpdateAppointmentInput = {};

  if (input.status !== undefined) {
    const validStatuses: AppointmentStatus[] = [
      "SCHEDULED",
      "PENDING_CLIENT_CONFIRMATION",
      "PENDING_PROFESSIONAL_CONFIRMATION",
      "CONFIRMED",
      "CANCELLED",
      "COMPLETED",
      "NO_SHOW",
      "REJECTED",
    ];
    if (!validStatuses.includes(input.status)) {
      throw new AppError("Invalid appointment status.", 400);
    }

    if (context) {
      assertCanTransitionAppointmentStatus(existing, input.status, context);
    }

    data.status = input.status;
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("At least one field must be provided to update.", 400);
  }

  return updateAppointment(id, data);
}

export async function confirmAppointment(
  id: string,
  context: AppointmentActorContext,
) {
  if (!id.trim()) {
    throw new AppError("Appointment id is required.", 400);
  }

  const existing = await findAppointmentById(id);
  if (!existing) {
    throw new AppError("Appointment not found.", 404);
  }

  await assertCanAccessAppointment(existing, context);

  // Only those waiting for approval can confirm
  if (existing.pendingApprovalFrom === "CLIENT") {
    if (context.actorRole !== "CLIENT") {
      throw new AppError("Only the client can confirm this appointment.", 403);
    }
    if (existing.clientId !== context.actorId) {
      throw new AppError("You can only confirm your own appointments.", 403);
    }
  } else if (existing.pendingApprovalFrom === "PROFESSIONAL") {
    if (context.actorRole !== "PROFESSIONAL") {
      throw new AppError(
        "Only the professional can confirm this appointment.",
        403,
      );
    }
    if (existing.professionalId !== context.actorId) {
      throw new AppError(
        "You can only confirm appointments for your own schedule.",
        403,
      );
    }
  } else {
    throw new AppError("This appointment is not pending any approval.", 400);
  }

  // Check for conflicts before confirming
  const conflicts = await findConflictingAppointments(
    existing.professionalId,
    existing.date,
    existing.startTime,
    existing.endTime,
  );

  if (conflicts.length > 0) {
    throw new AppError(
      "Time slot is no longer available. Appointment cannot be confirmed.",
      409,
    );
  }

  return updateAppointment(id, {
    status: "CONFIRMED",
    pendingApprovalFrom: null as any,
  });
}

export async function rejectAppointment(
  id: string,
  input: { rejectionReason?: string },
  context: AppointmentActorContext,
) {
  if (!id.trim()) {
    throw new AppError("Appointment id is required.", 400);
  }

  const existing = await findAppointmentById(id);
  if (!existing) {
    throw new AppError("Appointment not found.", 404);
  }

  await assertCanAccessAppointment(existing, context);

  // Only those waiting for approval can reject
  if (existing.pendingApprovalFrom === "CLIENT") {
    if (context.actorRole !== "CLIENT") {
      throw new AppError("Only the client can reject this appointment.", 403);
    }
    if (existing.clientId !== context.actorId) {
      throw new AppError("You can only reject your own appointments.", 403);
    }
  } else if (existing.pendingApprovalFrom === "PROFESSIONAL") {
    if (context.actorRole !== "PROFESSIONAL") {
      throw new AppError(
        "Only the professional can reject this appointment.",
        403,
      );
    }
    if (existing.professionalId !== context.actorId) {
      throw new AppError(
        "You can only reject appointments for your own schedule.",
        403,
      );
    }
  } else {
    throw new AppError("This appointment is not pending any approval.", 400);
  }

  return updateAppointment(id, {
    status: "REJECTED",
    pendingApprovalFrom: null as any,
    rejectionReason: input.rejectionReason || null,
    rejectedByUserId: context.actorId,
  } as any);
}

export async function deleteClientAppointmentWithContext(
  id: string,
  context?: AppointmentActorContext,
) {
  if (!id.trim()) {
    throw new AppError("Appointment id is required.", 400);
  }

  const existing = await findAppointmentById(id);
  if (!existing) {
    throw new AppError("Appointment not found.", 404);
  }

  if (context) {
    await assertCanAccessAppointment(existing, context);
  }

  if (existing.status === "COMPLETED" || existing.status === "NO_SHOW") {
    throw new AppError(
      `Cannot delete ${existing.status.toLowerCase()} appointment.`,
      400,
    );
  }

  return deleteAppointment(id);
}

export async function deleteClientAppointment(id: string) {
  if (!id.trim()) {
    throw new AppError("Appointment id is required.", 400);
  }

  const existing = await findAppointmentById(id);
  if (!existing) {
    throw new AppError("Appointment not found.", 404);
  }

  if (existing.status === "COMPLETED" || existing.status === "NO_SHOW") {
    throw new AppError(
      `Cannot delete ${existing.status.toLowerCase()} appointment.`,
      400,
    );
  }

  return deleteAppointment(id);
}
