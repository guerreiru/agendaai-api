import type { NextFunction, Request, Response } from "express";
import {
  getRefreshTokenFromLegacyBody,
  isLegacyRefreshBodyEnabled,
  login,
  refreshAccessToken,
  revokeRefreshToken,
} from "../services/auth.service";
import { findUserById } from "../repositories/user.repository";
import { validateLoginBody } from "../validators/auth.validator";
import { AppError } from "../utils/app-error";
import {
  getRefreshClearCookieOptions,
  getRefreshCookieOptions,
  REFRESH_COOKIE_NAME,
} from "../utils/auth-cookie";

export async function loginController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const body = validateLoginBody(request.body);
    const authResponse = await login(body);

    response.cookie(
      REFRESH_COOKIE_NAME,
      authResponse.refreshToken,
      getRefreshCookieOptions(),
    );

    return response.status(200).json({
      accessToken: authResponse.accessToken,
      expiresIn: authResponse.expiresIn,
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshTokenController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const cookieRefreshToken = request.cookies?.[REFRESH_COOKIE_NAME] as
      | string
      | undefined;
    const legacyBodyRefreshToken = isLegacyRefreshBodyEnabled()
      ? getRefreshTokenFromLegacyBody(request.body)
      : null;
    const refreshToken = cookieRefreshToken ?? legacyBodyRefreshToken;

    if (!refreshToken) {
      throw new AppError("Authentication required.", 401);
    }

    const authResponse = await refreshAccessToken(refreshToken);

    response.cookie(
      REFRESH_COOKIE_NAME,
      authResponse.refreshToken,
      getRefreshCookieOptions(),
    );

    if (!cookieRefreshToken && legacyBodyRefreshToken) {
      response.setHeader("x-refresh-token-deprecated", "true");
    }

    return response.status(200).json({
      accessToken: authResponse.accessToken,
      expiresIn: authResponse.expiresIn,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME] as
      | string
      | undefined;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    response.clearCookie(REFRESH_COOKIE_NAME, getRefreshClearCookieOptions());

    return response.status(204).send();
  } catch (error) {
    response.clearCookie(REFRESH_COOKIE_NAME, getRefreshClearCookieOptions());
    next(error);
  }
}

export async function getCurrentUserController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.userId) {
      throw new AppError("Authentication required.", 401);
    }

    const user = await findUserById(request.userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return response.status(200).json(user);
  } catch (error) {
    next(error);
  }
}
