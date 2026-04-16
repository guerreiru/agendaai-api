import type { NextFunction, Request, Response } from "express";
import {
    deleteUserAccount, getUser, getUsersByCompanyId, listUsers, searchClientUsersByEmailOrPhone,
    signUpUser, updateUserAccount
} from '../services/user.service.js';
import { AppError } from '../utils/app-error.js';
import { isString } from '../utils/isString.js';
import {
    validateCreateUserBody, validateSearchUsersQuery, validateUpdateUserBody
} from '../validators/user.validator.js';

import type { UserRole } from "../types/user.js";
export async function createUser(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const body = validateCreateUserBody(request.body);
    const user = await signUpUser(
      body,
      request.userId && request.userRole
        ? {
            actorId: request.userId,
            actorRole: request.userRole as UserRole,
          }
        : undefined,
    );

    return response.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function listUsersController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.userId || !request.userRole) {
      throw new AppError("Authentication required.", 401);
    }

    const users = await listUsers({
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

export async function getUserController(
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
      throw new AppError("User id is required.", 400);
    }

    const user = await getUser(id.trim(), {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateUserController(
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
      throw new AppError("User id is required.", 400);
    }

    const body = validateUpdateUserBody(request.body);
    const user = await updateUserAccount(id.trim(), body, {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export async function deleteUserController(
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
      throw new AppError("User id is required.", 400);
    }

    const user = await deleteUserAccount(id.trim(), {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export async function getUsersByCompanyController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.userId || !request.userRole) {
      throw new AppError("Authentication required.", 401);
    }

    const { companyId } = request.params;
    if (!isString(companyId) || !companyId.trim()) {
      throw new AppError("Company id is required.", 400);
    }

    const users = await getUsersByCompanyId(companyId.trim(), {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });
    return response.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

export async function searchUsersController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.userId || !request.userRole) {
      throw new AppError("Authentication required.", 401);
    }

    const rawQuery = request.query.query;
    const query = validateSearchUsersQuery(
      typeof rawQuery === "string" ? rawQuery : "",
    );
    const users = await searchClientUsersByEmailOrPhone(query, {
      actorId: request.userId,
      actorRole: request.userRole as UserRole,
    });

    return response.status(200).json(users);
  } catch (error) {
    next(error);
  }
}
