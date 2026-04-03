import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

describe("Schedule Exception Routes", () => {
  let accessToken: string;
  let professionalId: string;
  let userId: string;

  beforeEach(async () => {
    const uid = randomUUID();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: `prof-${uid}@test.com`,
        name: "Test Professional",
        password:
          "$2a$10$ixM4aL2ZhNxJLNH3/gB8zeHSv2kWxJ4xZjvNrGsCGI5V/jUqKqMz6", // hashed "password"
        role: "PROFESSIONAL",
      },
    });
    userId = user.id;
    professionalId = user.id;

    // Create token
    accessToken = jwt.sign(
      { userId: user.id, userEmail: user.email, userRole: user.role },
      process.env.JWT_SECRET || "test_secret",
      { expiresIn: "15m" },
    );
  });

  afterEach(async () => {
    // Cleanup with optional chaining to handle missing data
    try {
      await prisma.scheduleException.deleteMany({ where: { professionalId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    } catch (error) {
      // Cleanup errors are non-fatal for tests
      console.error("Cleanup error:", error);
    }
  });

  describe("POST /professionals/:professionalId/schedule-exceptions", () => {
    it("should create a schedule exception", async () => {
      const createBody = {
        type: "BLOCK",
        startDate: "2026-04-01T00:00:00Z",
        endDate: "2026-04-02T00:00:00Z",
        title: "Holiday",
        description: "Public holiday",
      };

      const response = await request(app)
        .post(`/professionals/${professionalId}/schedule-exceptions`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(createBody);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.type).toBe("BLOCK");
      expect(response.body.title).toBe("Holiday");
    });

    it("should return 401 without token", async () => {
      const createBody = {
        type: "BLOCK",
        startDate: "2026-04-01T00:00:00Z",
        endDate: "2026-04-02T00:00:00Z",
        title: "Holiday",
      };

      const response = await request(app)
        .post(`/professionals/${professionalId}/schedule-exceptions`)
        .send(createBody);

      expect(response.status).toBe(401);
    });

    it("should return 400 with missing required fields", async () => {
      const createBody = {
        type: "BLOCK",
        startDate: "2026-04-01T00:00:00Z",
        // missing endDate and title
      };

      const response = await request(app)
        .post(`/professionals/${professionalId}/schedule-exceptions`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(createBody);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /professionals/:professionalId/schedule-exceptions", () => {
    it("should get all exceptions for a professional", async () => {
      // Create exceptions
      await prisma.scheduleException.create({
        data: {
          professionalId,
          type: "BLOCK",
          startDate: new Date("2026-04-01"),
          endDate: new Date("2026-04-02"),
          title: "Holiday 1",
        },
      });

      await prisma.scheduleException.create({
        data: {
          professionalId,
          type: "BREAK",
          startDate: new Date("2026-04-05"),
          endDate: new Date("2026-04-05"),
          title: "Lunch Break",
        },
      });

      const response = await request(app)
        .get(`/professionals/${professionalId}/schedule-exceptions`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get(
        `/professionals/${professionalId}/schedule-exceptions`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /schedule-exceptions/:id", () => {
    it("should get a specific exception", async () => {
      const created = await prisma.scheduleException.create({
        data: {
          professionalId,
          type: "BLOCK",
          startDate: new Date("2026-04-01"),
          endDate: new Date("2026-04-02"),
          title: "Holiday",
        },
      });

      const response = await request(app)
        .get(`/schedule-exceptions/${created.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(created.id);
      expect(response.body.title).toBe("Holiday");
    });

    it("should return 404 if exception not found", async () => {
      const response = await request(app)
        .get("/schedule-exceptions/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /professionals/:professionalId/schedule-exceptions/:id", () => {
    it("should update an exception", async () => {
      const created = await prisma.scheduleException.create({
        data: {
          professionalId,
          type: "BLOCK",
          startDate: new Date("2026-04-01"),
          endDate: new Date("2026-04-02"),
          title: "Holiday",
        },
      });

      const updateBody = {
        title: "Updated Holiday",
      };

      const response = await request(app)
        .patch(
          `/professionals/${professionalId}/schedule-exceptions/${created.id}`,
        )
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateBody);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Updated Holiday");
    });
  });

  describe("DELETE /professionals/:professionalId/schedule-exceptions/:id", () => {
    it("should delete an exception", async () => {
      const created = await prisma.scheduleException.create({
        data: {
          professionalId,
          type: "BLOCK",
          startDate: new Date("2026-04-01"),
          endDate: new Date("2026-04-02"),
          title: "Holiday",
        },
      });

      const response = await request(app)
        .delete(
          `/professionals/${professionalId}/schedule-exceptions/${created.id}`,
        )
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(204);

      // Verify it's deleted
      const deleted = await prisma.scheduleException.findUnique({
        where: { id: created.id },
      });
      expect(deleted).toBeNull();
    });
  });
});
