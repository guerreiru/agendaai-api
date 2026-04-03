import type { NextFunction, Request, Response } from "express";
import {
  createCompanyAccount,
  deleteCompanyAccount,
  getCompany,
  getPublicCompanyBySlug,
  listCompanies,
  updateCompanyAccount,
} from "../services/company.service";
import type { UserRole } from "../types/user";
import { AppError } from "../utils/app-error";
import { isString } from "../utils/isString";
import {
  validateCreateCompanyBody,
  validateUpdateCompanyBody,
} from "../validators/company.validator";

export async function createCompanyController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.userId || !request.userRole) {
      throw new AppError("Authentication required.", 401);
    }

    const body = validateCreateCompanyBody(request.body);
    const company = await createCompanyAccount(body, {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(201).json(company);
  } catch (error) {
    next(error);
  }
}

export async function listCompaniesController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const companies = await listCompanies();
    return response.status(200).json(companies);
  } catch (error) {
    next(error);
  }
}

export async function getCompanyController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { id } = request.params;
    if (!isString(id) || !id.trim()) {
      throw new AppError("Company id is required.", 400);
    }

    const company = await getCompany(id.trim());
    return response.status(200).json(company);
  } catch (error) {
    next(error);
  }
}

export async function getPublicCompanyBySlugController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { slug } = request.params;
    if (!isString(slug) || !slug.trim()) {
      throw new AppError("Company slug is required.", 400);
    }

    const company = await getPublicCompanyBySlug(slug.trim());
    return response.status(200).json(company);
  } catch (error) {
    next(error);
  }
}

export async function updateCompanyController(
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
      throw new AppError("Company id is required.", 400);
    }

    const body = validateUpdateCompanyBody(request.body);
    const company = await updateCompanyAccount(id.trim(), body, {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(company);
  } catch (error) {
    next(error);
  }
}

export async function deleteCompanyController(
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
      throw new AppError("Company id is required.", 400);
    }

    const company = await deleteCompanyAccount(id.trim(), {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(company);
  } catch (error) {
    next(error);
  }
}
