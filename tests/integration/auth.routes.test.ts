import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../../src/app';
import * as authService from '../../src/services/auth.service';
import * as userService from '../../src/services/user.service';
import { AppError } from '../../src/utils/app-error';

vi.mock("../../src/services/auth.service");
vi.mock("../../src/services/user.service");

describe("HTTP integration - Auth routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(authService.getRefreshTokenFromLegacyBody).mockReturnValue(null);
    vi.mocked(authService.isLegacyRefreshBodyEnabled).mockReturnValue(true);
  });

  describe("POST /auth/login", () => {
    it("should return 200 with access token and set refresh cookie", async () => {
      vi.mocked(authService.login).mockResolvedValue({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-123",
        expiresIn: 900,
      });

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken", "access-token-123");
      expect(response.body).toHaveProperty("expiresIn", 900);
      expect(response.body).not.toHaveProperty("refreshToken");

      const setCookie = response.headers["set-cookie"];
      expect(Array.isArray(setCookie)).toBe(true);
      if (Array.isArray(setCookie)) {
        expect(
          setCookie.some((cookie) => cookie.includes("refresh_token=")),
        ).toBe(true);
        expect(setCookie.some((cookie) => cookie.includes("HttpOnly"))).toBe(
          true,
        );
        expect(setCookie.some((cookie) => cookie.includes("Path=/auth"))).toBe(
          true,
        );
        expect(
          setCookie.some((cookie) => cookie.includes("SameSite=Lax")),
        ).toBe(true);
      }
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app).post("/auth/login").send({
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("email");
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("password");
    });

    it("should return 401 when credentials are invalid", async () => {
      vi.mocked(authService.login).mockRejectedValue(
        new AppError("Invalid email or password.", 401),
      );

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /auth/refresh", () => {
    it("should return 200 with new access token when refresh cookie is valid", async () => {
      vi.mocked(authService.refreshAccessToken).mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expiresIn: 900,
      });

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", "refresh_token=valid-refresh-token");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken", "new-access-token");
      expect(response.body).not.toHaveProperty("refreshToken");

      const setCookie = response.headers["set-cookie"];
      expect(Array.isArray(setCookie)).toBe(true);
      if (Array.isArray(setCookie)) {
        expect(
          setCookie.some((cookie) => cookie.includes("refresh_token=")),
        ).toBe(true);
      }
    });

    it("should support legacy refresh token in body temporarily", async () => {
      vi.mocked(authService.refreshAccessToken).mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expiresIn: 900,
      });
      vi.mocked(authService.getRefreshTokenFromLegacyBody).mockReturnValue(
        "valid-refresh-token",
      );

      const response = await request(app).post("/auth/refresh").send({
        refreshToken: "valid-refresh-token",
      });

      expect(response.status).toBe(200);
      expect(response.headers["x-refresh-token-deprecated"]).toBe("true");
    });

    it("should reject legacy body when fallback is disabled", async () => {
      vi.mocked(authService.isLegacyRefreshBodyEnabled).mockReturnValue(false);

      const response = await request(app).post("/auth/refresh").send({
        refreshToken: "valid-refresh-token",
      });

      expect(response.status).toBe(401);
    });

    it("should return 401 when refresh token is missing", async () => {
      const response = await request(app).post("/auth/refresh").send({});

      expect(response.status).toBe(401);
    });

    it("should return 401 when refresh token is invalid", async () => {
      vi.mocked(authService.refreshAccessToken).mockRejectedValue(
        new AppError("Invalid refresh token.", 401),
      );

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", "refresh_token=invalid-token");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /auth/logout", () => {
    it("should clear refresh cookie and return 204", async () => {
      const response = await request(app)
        .post("/auth/logout")
        .set("Cookie", "refresh_token=valid-token");

      expect(response.status).toBe(204);
      expect(vi.mocked(authService.revokeRefreshToken)).toHaveBeenCalledTimes(
        1,
      );

      const setCookie = response.headers["set-cookie"];
      expect(Array.isArray(setCookie)).toBe(true);
      if (Array.isArray(setCookie)) {
        expect(
          setCookie.some((cookie) => cookie.includes("refresh_token=")),
        ).toBe(true);
        expect(setCookie.some((cookie) => cookie.includes("Path=/auth"))).toBe(
          true,
        );
      }
    });
  });

  describe("CORS with credentials", () => {
    it("should allow configured frontend origin", async () => {
      vi.mocked(authService.login).mockResolvedValue({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-123",
        expiresIn: 900,
      });

      const response = await request(app)
        .post("/auth/login")
        .set("Origin", "http://localhost:5173")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5173",
      );
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("should block invalid origin", async () => {
      const response = await request(app)
        .post("/auth/login")
        .set("Origin", "http://malicious.local")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("CORS origin not allowed");
    });
  });

  describe("Authentication middleware", () => {
    it("should allow requests with valid Bearer token", async () => {
      const validToken = jwt.sign(
        { userId: "user-1", email: "test@example.com", role: "CLIENT" },
        process.env.JWT_SECRET || "your-secret-key-change-in-production",
        { expiresIn: "15m" },
      );

      vi.mocked(authService.verifyAccessToken).mockReturnValue({
        userId: "user-1",
        email: "test@example.com",
        role: "CLIENT",
      } as never);

      vi.mocked(userService.getUser).mockResolvedValue({
        id: "user-1",
      } as never);

      const response = await request(app)
        .get("/users/user-1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe("User signup", () => {
    it("should create user and return 201", async () => {
      vi.mocked(userService.signUpUser).mockResolvedValue({
        id: "user-1",
        name: "New User",
        email: "new@example.com",
      } as never);

      const response = await request(app).post("/users").send({
        name: "New User",
        email: "new@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
    });
  });
});
