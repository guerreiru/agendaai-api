import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../src/middlewares/errorHandler";
import { AppError } from "../../src/utils/app-error";
import { hashPassword, verifyPassword } from "../../src/utils/password";
import {
  getRefreshTokenExpiryDate,
  hashRefreshToken,
} from "../../src/utils/refresh-token";

describe("utils and middleware", () => {
  describe("password", () => {
    it("hashes and verifies the same password", () => {
      const plain = "my-secret-password";
      const hash = hashPassword(plain);

      expect(hash).toContain(":");
      expect(verifyPassword(plain, hash)).toBe(true);
      expect(verifyPassword("another-password", hash)).toBe(false);
    });

    it("returns false for malformed hash", () => {
      expect(verifyPassword("abc", "malformed")).toBe(false);
    });

    it("returns false when hash key has invalid byte length", () => {
      const hashWithInvalidKeyLength = "abcd:00";

      expect(verifyPassword("abc", hashWithInvalidKeyLength)).toBe(false);
    });
  });

  describe("refresh-token", () => {
    it("creates deterministic sha256 hash", () => {
      const token = "refresh-token-example";

      expect(hashRefreshToken(token)).toHaveLength(64);
      expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
      expect(hashRefreshToken(token)).not.toBe(hashRefreshToken("other-token"));
    });

    it("returns expiry date around 7 days in future", () => {
      const before = Date.now();
      const expiry = getRefreshTokenExpiryDate();
      const after = Date.now();

      const minExpected = before + 6 * 24 * 60 * 60 * 1000;
      const maxExpected = after + 8 * 24 * 60 * 60 * 1000;

      expect(expiry.getTime()).toBeGreaterThan(minExpected);
      expect(expiry.getTime()).toBeLessThan(maxExpected);
    });
  });

  describe("errorHandler", () => {
    it("delegates to next when headers are already sent", () => {
      const request = {} as never;
      const next = vi.fn();
      const response = {
        headersSent: true,
      } as never;

      errorHandler(new Error("boom"), request, response, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it("returns app error response with stack in development", () => {
      vi.stubEnv("NODE_ENV", "development");

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const response = {
        headersSent: false,
        status,
      } as never;

      errorHandler(
        new AppError("invalid", 422),
        {} as never,
        response,
        vi.fn(),
      );

      expect(status).toHaveBeenCalledWith(422);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "invalid",
          stack: expect.any(String),
        }),
      );
      vi.unstubAllEnvs();
    });

    it("returns generic error without message outside development", () => {
      vi.stubEnv("NODE_ENV", "production");
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const response = {
        headersSent: false,
        status,
      } as never;

      errorHandler(new Error("sensitive"), {} as never, response, vi.fn());

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: "Internal server error.",
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it("returns message for generic error in development", () => {
      vi.stubEnv("NODE_ENV", "development");
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const response = {
        headersSent: false,
        status,
      } as never;

      errorHandler(new Error("boom"), {} as never, response, vi.fn());

      expect(json).toHaveBeenCalledWith({
        error: "Internal server error.",
        message: "boom",
      });

      consoleErrorSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it("handles non-error throws", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const response = {
        headersSent: false,
        status,
      } as never;

      errorHandler("string error" as never, {} as never, response, vi.fn());

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "Internal server error." });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
