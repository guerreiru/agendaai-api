import { describe, it, expect, beforeEach, vi } from "vitest";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../../src/services/auth.service";

vi.mock("../../src/repositories/user.repository");
vi.mock("../../src/utils/password");

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });
});
