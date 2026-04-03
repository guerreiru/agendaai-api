import { AppError } from "../utils/app-error";
import { isString } from "../utils/isString";
import type {
  CreateAppointmentBody,
  UpdateAppointmentBody,
} from "../types/appointment";

export function validateCreateAppointmentBody(
  body: unknown,
): CreateAppointmentBody {
  if (typeof body !== "object" || body === null) {
    throw new AppError("Invalid request body.", 400);
  }

  const {
    companyId,
    clientId,
    professionalId,
    serviceId,
    date,
    startTime,
    endTime,
  } = body as Record<string, unknown>;

  if (!isString(companyId) || !companyId.trim()) {
    throw new AppError("The companyId is required.", 400);
  }

  if (!isString(clientId) || !clientId.trim()) {
    throw new AppError("The clientId is required.", 400);
  }

  if (!isString(professionalId) || !professionalId.trim()) {
    throw new AppError("The professionalId is required.", 400);
  }

  if (!isString(serviceId) || !serviceId.trim()) {
    throw new AppError("The serviceId is required.", 400);
  }

  if (!isString(date) || !date.trim()) {
    throw new AppError("The date is required.", 400);
  }

  if (!isString(startTime) || !startTime.trim()) {
    throw new AppError("The startTime is required.", 400);
  }

  if (!isString(endTime) || !endTime.trim()) {
    throw new AppError("The endTime is required.", 400);
  }

  return {
    companyId: companyId.trim(),
    clientId: clientId.trim(),
    professionalId: professionalId.trim(),
    serviceId: serviceId.trim(),
    date: date.trim(),
    startTime: startTime.trim(),
    endTime: endTime.trim(),
  };
}

export function validateUpdateAppointmentBody(
  body: unknown,
): UpdateAppointmentBody {
  if (typeof body !== "object" || body === null) {
    throw new AppError("Invalid request body.", 400);
  }

  const { status } = body as Record<string, unknown>;
  const data: UpdateAppointmentBody = {};

  if (status !== undefined) {
    if (!isString(status) || !status.trim()) {
      throw new AppError("The status cannot be empty.", 400);
    }
    data.status = status.trim() as any;
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("At least one field must be provided to update.", 400);
  }

  return data;
}
