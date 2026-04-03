import type { ExceptionType } from "../../generated/prisma/enums";
import { AppError } from "../utils/app-error";
import type {
  ScheduleExceptionBody,
  UpdateScheduleExceptionBody,
} from "../types/schedule-exception";

export function validateCreateScheduleExceptionBody(
  body: any,
): ScheduleExceptionBody {
  if (!body.type) {
    throw new AppError("Type is required", 400);
  }

  if (!["BLOCK", "BREAK"].includes(body.type)) {
    throw new AppError("Type must be either BLOCK or BREAK", 400);
  }

  if (!body.startDate) {
    throw new AppError("Start date is required", 400);
  }

  if (!body.endDate) {
    throw new AppError("End date is required", 400);
  }

  if (!body.title) {
    throw new AppError("Title is required", 400);
  }

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);

  if (isNaN(startDate.getTime())) {
    throw new AppError("Start date must be a valid ISO date", 400);
  }

  if (isNaN(endDate.getTime())) {
    throw new AppError("End date must be a valid ISO date", 400);
  }

  if (endDate <= startDate) {
    throw new AppError("End date must be after start date", 400);
  }

  if (typeof body.title !== "string" || body.title.trim().length === 0) {
    throw new AppError("Title must be a non-empty string", 400);
  }

  return {
    type: body.type as ExceptionType,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    title: body.title.trim(),
    description: body.description?.trim() || undefined,
  };
}

export function validateUpdateScheduleExceptionBody(
  body: any,
): UpdateScheduleExceptionBody {
  if (!body || Object.keys(body).length === 0) {
    throw new AppError("At least one field must be provided for update", 400);
  }

  const updates: UpdateScheduleExceptionBody = {};

  if (body.type !== undefined) {
    if (!["BLOCK", "BREAK"].includes(body.type)) {
      throw new AppError("Type must be either BLOCK or BREAK", 400);
    }
    updates.type = body.type as ExceptionType;
  }

  if (body.startDate !== undefined) {
    const startDate = new Date(body.startDate);
    if (isNaN(startDate.getTime())) {
      throw new AppError("Start date must be a valid ISO date", 400);
    }
    updates.startDate = startDate.toISOString();
  }

  if (body.endDate !== undefined) {
    const endDate = new Date(body.endDate);
    if (isNaN(endDate.getTime())) {
      throw new AppError("End date must be a valid ISO date", 400);
    }
    updates.endDate = endDate.toISOString();
  }

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      throw new AppError("Title must be a non-empty string", 400);
    }
    updates.title = body.title.trim();
  }

  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null;
  }

  // Validate date range if both are provided
  if (updates.startDate && updates.endDate) {
    const startDate = new Date(updates.startDate);
    const endDate = new Date(updates.endDate);
    if (endDate <= startDate) {
      throw new AppError("End date must be after start date", 400);
    }
  }

  return updates;
}

export function validateGetSlotsParams(params: any) {
  if (!params.professionalId) {
    throw new AppError("Professional ID is required", 400);
  }

  if (!params.serviceId) {
    throw new AppError("Service ID is required", 400);
  }

  if (!params.date) {
    throw new AppError("Date is required", 400);
  }

  const date = new Date(params.date);
  if (isNaN(date.getTime())) {
    throw new AppError("Date must be a valid ISO date", 400);
  }

  return {
    professionalId: params.professionalId as string,
    serviceId: params.serviceId as string,
    date: date.toISOString().split("T")[0] || "",
  };
}
