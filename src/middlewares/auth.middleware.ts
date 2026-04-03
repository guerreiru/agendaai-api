import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/auth.service";
import { AppError } from "../utils/app-error";
import type { UserRole } from "../types/user";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
    }
  }
}

export function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Missing or invalid authorization header.", 401);
    }

    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Invalid authorization header");
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    request.userId = payload.userId;
    request.userEmail = payload.email ?? payload.userEmail;
    request.userRole = payload.role ?? payload.userRole;

    next();
  } catch (error) {
    next(error);
  }
}

export function optionalAuthMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Invalid authorization header");
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    request.userId = payload.userId;
    request.userEmail = payload.email ?? payload.userEmail;
    request.userRole = payload.role ?? payload.userRole;

    next();
  } catch (error) {
    next();
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    try {
      if (!request.userId || !request.userRole) {
        throw new AppError("Authentication required.", 401);
      }

      if (!roles.includes(request.userRole as UserRole)) {
        throw new AppError("Insufficient permissions.", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
