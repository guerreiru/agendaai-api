import type { Prisma } from "../../generated/prisma/browser.js";
import type { AppointmentStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";

import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../types/appointment.js";

export async function findAppointmentById(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
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

export async function findAppointments(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Prisma.AppointmentWhereInput = {};

  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  return prisma.appointment.findMany({
    where,
    orderBy: { createdAt: "desc" },
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

export async function findAppointmentsByClient(clientId: string) {
  return prisma.appointment.findMany({
    where: { clientId },
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

export async function findAppointmentsByProfessional(professionalId: string) {
  return prisma.appointment.findMany({
    where: { professionalId },
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

export async function findAppointmentsByCompany(companyId: string) {
  return prisma.appointment.findMany({
    where: { companyId },
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

export async function findConflictingAppointments(
  professionalId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeId?: string,
) {
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);

  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  const baseQuery = {
    professionalId,
    date: {
      gte: dateStart,
      lte: dateEnd,
    },
    startTime: {
      lt: endTime,
    },
    endTime: {
      gt: startTime,
    },
    status: {
      in: ["SCHEDULED", "CONFIRMED", "COMPLETED"] as AppointmentStatus[],
    },
  };

  const query = excludeId
    ? { ...baseQuery, NOT: { id: excludeId } }
    : baseQuery;

  return prisma.appointment.findMany({
    where: query,
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

export async function createAppointment(data: CreateAppointmentInput) {
  const { date, ...rest } = data;
  return prisma.appointment.create({
    data: {
      ...rest,
      date: new Date(date),
    },
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

export async function updateAppointment(
  id: string,
  data: UpdateAppointmentInput,
) {
  return prisma.appointment.update({
    where: { id },
    data,
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

export async function deleteAppointment(id: string) {
  return prisma.appointment.delete({
    where: { id },
  });
}

function getUtcDateStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function getUtcTimeString(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export async function expirePastAppointments(now = new Date()) {
  const currentUtcDate = getUtcDateStart(now);
  const currentUtcTime = getUtcTimeString(now);

  const result = await prisma.appointment.updateMany({
    where: {
      status: {
        in: ["SCHEDULED", "CONFIRMED"],
      },
      OR: [
        {
          date: {
            lt: currentUtcDate,
          },
        },
        {
          date: currentUtcDate,
          endTime: {
            lte: currentUtcTime,
          },
        },
      ],
    },
    data: {
      status: "NO_SHOW",
    },
  });

  return result.count;
}
