import type { AppointmentStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";

const APPOINTMENT_STATUSES_FOR_TODAY: AppointmentStatus[] = [
  "SCHEDULED",
  "PENDING_CLIENT_CONFIRMATION",
  "PENDING_PROFESSIONAL_CONFIRMATION",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
];

const APPOINTMENT_STATUSES_FOR_REVENUE: AppointmentStatus[] = [
  "CONFIRMED",
  "COMPLETED",
];

const APPOINTMENT_STATUSES_FOR_UPCOMING: AppointmentStatus[] = [
  "SCHEDULED",
  "PENDING_CLIENT_CONFIRMATION",
  "PENDING_PROFESSIONAL_CONFIRMATION",
  "CONFIRMED",
];

type DashboardNextAppointment = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  price: number;
  status: AppointmentStatus;
  service: {
    id: string;
    name: string;
  };
  professional: {
    id: string;
    name: string;
    displayName: string | null;
  };
  client: {
    id: string;
    name: string;
  };
};

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function getDatePartsInTimezone(date: Date, timezone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    throw new Error("Failed to process date in timezone.");
  }

  return { year, month, day };
}

function toUtcDateOnly(parts: DateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function getMonthBoundaries(referenceDate: Date, timezone: string) {
  const { year, month } = getDatePartsInTimezone(referenceDate, timezone);
  const monthStart = toUtcDateOnly({ year, month, day: 1 });

  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthStart = toUtcDateOnly({
    year: nextMonthYear,
    month: nextMonth,
    day: 1,
  });

  return { monthStart, nextMonthStart };
}

function getTodayDate(referenceDate: Date, timezone: string): Date {
  return toUtcDateOnly(getDatePartsInTimezone(referenceDate, timezone));
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

function timeToMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function filterUpcomingAppointments(
  appointments: DashboardNextAppointment[],
  todayDate: Date,
  nowMinutes: number,
) {
  const todayTime = todayDate.getTime();

  return appointments
    .filter((appointment) => {
      const appointmentDateTime = appointment.date.getTime();

      if (appointmentDateTime > todayTime) {
        return true;
      }

      if (appointmentDateTime < todayTime) {
        return false;
      }

      return timeToMinutes(appointment.startTime) >= nowMinutes;
    })
    .slice(0, 3);
}

async function findUpcomingAppointmentsByCompany(
  companyId: string,
  todayDate: Date,
  nowMinutes: number,
) {
  const appointments = await prisma.appointment.findMany({
    where: {
      companyId,
      date: {
        gte: todayDate,
      },
      status: {
        in: APPOINTMENT_STATUSES_FOR_UPCOMING,
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 30,
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      price: true,
      status: true,
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return filterUpcomingAppointments(appointments, todayDate, nowMinutes);
}

export async function getCompanyDashboardSummary(
  companyId: string,
  timezone: string,
  referenceDate = new Date(),
) {
  const todayDate = getTodayDate(referenceDate, timezone);
  const nowMinutes = getMinutesInTimezone(referenceDate, timezone);
  const { monthStart, nextMonthStart } = getMonthBoundaries(
    referenceDate,
    timezone,
  );

  const [
    serviceCount,
    professionalCount,
    todayAppointmentsCount,
    monthRevenueResult,
    nextAppointments,
  ] = await Promise.all([
    prisma.service.count({
      where: { companyId },
    }),
    prisma.user.count({
      where: {
        companyId,
        role: "PROFESSIONAL",
      },
    }),
    prisma.appointment.count({
      where: {
        companyId,
        date: todayDate,
        status: {
          in: APPOINTMENT_STATUSES_FOR_TODAY,
        },
      },
    }),
    prisma.appointment.aggregate({
      where: {
        companyId,
        date: {
          gte: monthStart,
          lt: nextMonthStart,
        },
        status: {
          in: APPOINTMENT_STATUSES_FOR_REVENUE,
        },
      },
      _sum: {
        price: true,
      },
    }),
    findUpcomingAppointmentsByCompany(companyId, todayDate, nowMinutes),
  ]);

  return {
    companyId,
    serviceCount,
    professionalCount,
    todayAppointmentsCount,
    monthRevenue: monthRevenueResult._sum.price ?? 0,
    nextAppointments,
  };
}

export async function getProfessionalDashboardSummary(
  professionalId: string,
  timezone: string,
  referenceDate = new Date(),
) {
  const todayDate = getTodayDate(referenceDate, timezone);
  const { monthStart, nextMonthStart } = getMonthBoundaries(
    referenceDate,
    timezone,
  );

  const [activeServiceCount, todayAppointmentsCount, monthRevenueResult] =
    await Promise.all([
      prisma.professionalService.count({
        where: {
          professionalId,
          isActive: true,
        },
      }),
      prisma.appointment.count({
        where: {
          professionalId,
          date: todayDate,
          status: {
            in: APPOINTMENT_STATUSES_FOR_TODAY,
          },
        },
      }),
      prisma.appointment.aggregate({
        where: {
          professionalId,
          date: {
            gte: monthStart,
            lt: nextMonthStart,
          },
          status: {
            in: APPOINTMENT_STATUSES_FOR_REVENUE,
          },
        },
        _sum: {
          price: true,
        },
      }),
    ]);

  return {
    professionalId,
    activeServiceCount,
    todayAppointmentsCount,
    monthRevenue: monthRevenueResult._sum.price ?? 0,
  };
}
