import type { NextFunction, Request, Response } from "express";
import {
  createProfessionalAvailability,
  deleteProfessionalAvailabilityWithContext,
  getAvailability,
  listAllAvailabilities,
  listProfessionalAvailabilities,
  updateProfessionalAvailability,
} from "../services/availability.service";
import type { UserRole } from "../types/user";
import { AppError } from "../utils/app-error";
import { isString } from "../utils/isString";
import {
  validateCreateAvailabilityBody,
  validateUpdateAvailabilityBody,
} from "../validators/availability.validator";

export async function createAvailabilityController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.userId || !request.userRole) {
      throw new AppError("Authentication required.", 401);
    }

    const body = validateCreateAvailabilityBody(request.body);
    const availability = await createProfessionalAvailability(body, {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(201).json(availability);
  } catch (error) {
    next(error);
  }
}

export async function listAvailabilitiesController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.userId || !request.userRole) {
      throw new AppError("Authentication required.", 401);
    }

    const availabilities = await listAllAvailabilities({
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(availabilities);
  } catch (error) {
    next(error);
  }
}

export async function listProfessionalAvailabilitiesController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { professionalId } = request.params;
    if (!isString(professionalId) || !professionalId.trim()) {
      throw new AppError("Professional id is required.", 400);
    }

    const availabilities = await listProfessionalAvailabilities(
      professionalId.trim(),
    );
    return response.status(200).json(availabilities);
  } catch (error) {
    next(error);
  }
}

export async function getAvailabilityController(
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
      throw new AppError("Availability id is required.", 400);
    }

    const availability = await getAvailability(id.trim(), {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(availability);
  } catch (error) {
    next(error);
  }
}

export async function updateAvailabilityController(
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
      throw new AppError("Availability id is required.", 400);
    }

    const body = validateUpdateAvailabilityBody(request.body);
    const availability = await updateProfessionalAvailability(id.trim(), body, {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(availability);
  } catch (error) {
    next(error);
  }
}

export async function deleteAvailabilityController(
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
      throw new AppError("Availability id is required.", 400);
    }

    const availability = await deleteProfessionalAvailabilityWithContext(
      id.trim(),
      {
        actorId: request.userId,
        actorRole: request.userRole as UserRole,
      },
    );
    return response.status(200).json(availability);
  } catch (error) {
    next(error);
  }
}
