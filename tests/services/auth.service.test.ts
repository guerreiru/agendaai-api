import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as refreshSessionRepository from '../../src/repositories/refresh-session.repository';
import * as userRepository from '../../src/repositories/user.repository';
import {
    getRefreshTokenFromLegacyBody, isLegacyRefreshBodyEnabled, login, refreshAccessToken,
    revokeRefreshToken, verifyAccessToken
} from '../../src/services/auth.service';
import { AppError } from '../../src/utils/app-error';
import * as passwordUtils from '../../src/utils/password';
import * as refreshTokenUtils from '../../src/utils/refresh-token';

vi.mock("../../src/repositories/user.repository");
vi.mock("../../src/repositories/refresh-session.repository");
vi.mock("../../src/utils/password");
vi.mock("../../src/utils/refresh-token");

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should login and create refresh session", async () => {
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
        id: "u-1",
        email: "user@email.com",
        role: "CLIENT",
        password: "stored-hash",
      } as never);
      vi.mocked(passwordUtils.verifyPassword).mockReturnValue(true);
      vi.mocked(refreshTokenUtils.hashRefreshToken).mockReturnValue(
        "hashed-refresh",
      );
      vi.mocked(refreshTokenUtils.getRefreshTokenExpiryDate).mockReturnValue(
        new Date("2026-05-01T00:00:00.000Z"),
      );

      const result = await login({
        email: "user@email.com",
        password: "123456",
      });

      expect(result.accessToken).toBeTypeOf("string");
      expect(result.refreshToken).toBeTypeOf("string");
      expect(result.expiresIn).toBe(
        refreshTokenUtils.ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      );
      expect(
        refreshSessionRepository.createRefreshSession,
      ).toHaveBeenCalledWith({
        userId: "u-1",
        tokenHash: "hashed-refresh",
        expiresAt: new Date("2026-05-01T00:00:00.000Z"),
      });
    });

    it("should reject when user does not exist", async () => {
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);

      await expect(
        login({ email: "missing@email.com", password: "123456" }),
      ).rejects.toBeInstanceOf(AppError);
    });

    it("should reject when password does not match", async () => {
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
        id: "u-1",
        email: "user@email.com",
        role: "CLIENT",
        password: "stored-hash",
      } as never);
      vi.mocked(passwordUtils.verifyPassword).mockReturnValue(false);

      await expect(
        login({ email: "user@email.com", password: "wrong" }),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("refreshAccessToken", () => {
    it("should rotate tokens for a valid refresh token", async () => {
      const currentRefreshToken = jwt.sign(
        {
          userId: "u-1",
          email: "user@email.com",
          role: "CLIENT",
          tokenId: "token-1",
        },
        process.env.REFRESH_TOKEN_SECRET || "test-refresh_token_secret",
        { expiresIn: "7d" },
      );

      vi.mocked(refreshTokenUtils.hashRefreshToken).mockReturnValue("old-hash");
      vi.mocked(
        refreshSessionRepository.findActiveRefreshSessionByHash,
      ).mockResolvedValue({
        id: "session-1",
      } as never);
      vi.mocked(userRepository.findUserById).mockResolvedValue({
        id: "u-1",
        email: "user@email.com",
        role: "CLIENT",
      } as never);
      vi.mocked(refreshTokenUtils.getRefreshTokenExpiryDate).mockReturnValue(
        new Date("2026-05-02T00:00:00.000Z"),
      );

      const result = await refreshAccessToken(currentRefreshToken);

      expect(result.accessToken).toBeTypeOf("string");
      expect(result.refreshToken).toBeTypeOf("string");
      expect(
        refreshSessionRepository.revokeRefreshSessionByHash,
      ).toHaveBeenCalledWith("old-hash");
      expect(refreshSessionRepository.createRefreshSession).toHaveBeenCalled();
    });

    it("should reject when refresh session is not active", async () => {
      const token = jwt.sign(
        {
          userId: "u-1",
          email: "user@email.com",
          role: "CLIENT",
        },
        process.env.REFRESH_TOKEN_SECRET || "test-refresh_token_secret",
        { expiresIn: "7d" },
      );

      vi.mocked(refreshTokenUtils.hashRefreshToken).mockReturnValue("hash");
      vi.mocked(
        refreshSessionRepository.findActiveRefreshSessionByHash,
      ).mockResolvedValue(null);

      await expect(refreshAccessToken(token)).rejects.toBeInstanceOf(AppError);
    });

    it("should reject when user is not found", async () => {
      const token = jwt.sign(
        {
          userId: "u-1",
          email: "user@email.com",
          role: "CLIENT",
        },
        process.env.REFRESH_TOKEN_SECRET || "test-refresh_token_secret",
        { expiresIn: "7d" },
      );

      vi.mocked(refreshTokenUtils.hashRefreshToken).mockReturnValue("hash");
      vi.mocked(
        refreshSessionRepository.findActiveRefreshSessionByHash,
      ).mockResolvedValue({
        id: "session-1",
      } as never);
      vi.mocked(userRepository.findUserById).mockResolvedValue(null);

      await expect(refreshAccessToken(token)).rejects.toBeInstanceOf(AppError);
    });

    it("should reject malformed refresh token", async () => {
      await expect(refreshAccessToken("invalid-token")).rejects.toBeInstanceOf(
        AppError,
      );
    });
  });

  describe("revokeRefreshToken", () => {
    it("should hash and revoke refresh token", async () => {
      vi.mocked(refreshTokenUtils.hashRefreshToken).mockReturnValue(
        "hashed-token",
      );

      await revokeRefreshToken("raw-token");

      expect(
        refreshSessionRepository.revokeRefreshSessionByHash,
      ).toHaveBeenCalledWith("hashed-token");
    });
  });

  describe("legacy refresh body helpers", () => {
    it("should return false when env is undefined", () => {
      vi.unstubAllEnvs();
      delete process.env.AUTH_ALLOW_LEGACY_REFRESH_BODY;

      expect(isLegacyRefreshBodyEnabled()).toBe(false);
    });

    it("should parse enabled env in case-insensitive way", () => {
      vi.stubEnv("AUTH_ALLOW_LEGACY_REFRESH_BODY", "TrUe");
      expect(isLegacyRefreshBodyEnabled()).toBe(true);
      vi.unstubAllEnvs();
    });

    it("should extract refresh token from body", () => {
      expect(getRefreshTokenFromLegacyBody(null)).toBeNull();
      expect(getRefreshTokenFromLegacyBody({ refreshToken: 123 })).toBeNull();
      expect(getRefreshTokenFromLegacyBody({ refreshToken: "   " })).toBeNull();
      expect(
        getRefreshTokenFromLegacyBody({ refreshToken: "  my-token  " }),
      ).toBe("my-token");
    });
  });

  describe("verifyAccessToken", () => {
    it("should return payload for valid access token", () => {
      const token = jwt.sign(
        {
          userId: "user-123",
          email: "test@example.com",
          role: "CLIENT",
        },
        process.env.JWT_SECRET || "your-secret-key-change-in-production",
        { expiresIn: "15m" },
      );

      const payload = verifyAccessToken(token);

      expect(payload.userId).toBe("user-123");
      expect(payload.email).toBe("test@example.com");
      expect(payload.role).toBe("CLIENT");
    });

    it("should throw error for invalid access token", () => {
      expect(() => verifyAccessToken("invalid-token")).toThrow();
    });

    it("should throw error for expired access token", () => {
      const expiredToken = jwt.sign(
        {
          userId: "user-123",
          email: "test@example.com",
          role: "CLIENT",
        },
        process.env.JWT_SECRET || "your-secret-key-change-in-production",
        { expiresIn: "-1h" },
      );

      expect(() => verifyAccessToken(expiredToken)).toThrow(
        "Access token expired.",
      );
    });

    it("should throw error when token is signed with different secret", () => {
      const token = jwt.sign(
        {
          userId: "user-123",
          email: "test@example.com",
          role: "CLIENT",
        },
        "wrong-secret",
        { expiresIn: "15m" },
      );

      expect(() => verifyAccessToken(token)).toThrow("Invalid access token.");
    });

    it("should rethrow unknown verification errors", () => {
      const unexpected = new Error("unexpected");
      const verifySpy = vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
        throw unexpected;
      });

      expect(() => verifyAccessToken("token")).toThrow("unexpected");

      verifySpy.mockRestore();
    });
  });
});
