import type { ExceptionType } from "../../generated/prisma/enums";

export interface ScheduleExceptionBody {
  type: ExceptionType;
  startDate: string;
  endDate: string;
  title: string;
  description?: string;
}

export interface ScheduleExceptionResponse {
  id: string;
  professionalId: string;
  type: ExceptionType;
  startDate: string;
  endDate: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateScheduleExceptionBody {
  type?: ExceptionType;
  startDate?: string;
  endDate?: string;
  title?: string;
  description?: string | null;
}
