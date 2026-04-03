import type { NextFunction, Request, Response } from "express";
import {
  createCatalogService,
  deleteCatalogService,
  getCatalogService,
  listCatalogServices,
  listCatalogServicesByCompany,
  updateCatalogService,
} from "../services/service.service";
import type { UserRole } from "../types/user";
import { AppError } from "../utils/app-error";
import { isString } from "../utils/isString";
import {
  validateCreateServiceBody,
  validateUpdateServiceBody,
} from "../validators/service.validator";

export async function createServiceController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.userId || !request.userRole) {
      throw new AppError("Authentication required.", 401);
    }

    const body = validateCreateServiceBody(request.body);
    const service = await createCatalogService(body, {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(201).json(service);
  } catch (error) {
    next(error);
  }
}

export async function listServicesController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.userId || !request.userRole) {
      throw new AppError("Authentication required.", 401);
    }

    const services = await listCatalogServices({
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(services);
  } catch (error) {
    next(error);
  }
}

export async function listCompanyServicesController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { companyId } = request.params;
    if (!isString(companyId) || !companyId.trim()) {
      throw new AppError("Company id is required.", 400);
    }

    const services = await listCatalogServicesByCompany(companyId.trim());
    return response.status(200).json(services);
  } catch (error) {
    next(error);
  }
}

export async function getServiceController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { id } = request.params;
    if (!isString(id) || !id.trim()) {
      throw new AppError("Service id is required.", 400);
    }

    const service = await getCatalogService(id.trim());
    return response.status(200).json(service);
  } catch (error) {
    next(error);
  }
}

export async function updateServiceController(
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
      throw new AppError("Service id is required.", 400);
    }

    const body = validateUpdateServiceBody(request.body);
    const service = await updateCatalogService(id.trim(), body, {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(service);
  } catch (error) {
    next(error);
  }
}

export async function deleteServiceController(
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
      throw new AppError("Service id is required.", 400);
    }

    const service = await deleteCatalogService(id.trim(), {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(service);
  } catch (error) {
    next(error);
  }
}
