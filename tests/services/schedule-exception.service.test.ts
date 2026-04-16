import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/lib/prisma';
import { scheduleExceptionService } from '../../src/services/schedule-exception.service';

describe("ScheduleExceptionService", () => {
  let professionalId: string;
  let userId: string;

  beforeEach(async () => {
    // Create test user (professional)
    const user = await prisma.user.create({
      data: {
        email: `professional-${Date.now()}@test.com`,
        name: "Test Professional",
        password: "hashed_password_123",
        role: "PROFESSIONAL",
      },
    });
    userId = user.id;
    professionalId = user.id;
  });

  afterEach(async () => {
    // Cleanup only records created by this test file to avoid cross-file interference.
    try {
      await prisma.scheduleException.deleteMany({ where: { professionalId } });
      await prisma.user.deleteMany({
        where: { id: userId },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("createException", () => {
    it("should create a schedule exception successfully", async () => {
      const body = {
        type: "BLOCK" as const,
        startDate: "2026-04-01T00:00:00Z",
        endDate: "2026-04-02T00:00:00Z",
        title: "Holiday",
        description: "Public holiday",
      };

      const result = await scheduleExceptionService.createException(
        professionalId,
        body,
      );

      expect(result).toBeDefined();
      expect(result.type).toBe("BLOCK");
      expect(result.title).toBe("Holiday");
      expect(result.description).toBe("Public holiday");
    });

    it("should throw error if professional does not exist", async () => {
      const body = {
        type: "BLOCK" as const,
        startDate: "2026-04-01T00:00:00Z",
        endDate: "2026-04-02T00:00:00Z",
        title: "Holiday",
      };

      await expect(
        scheduleExceptionService.createException("non-existent-id", body),
      ).rejects.toThrow("Professional not found");
    });

    it("should create exception with BREAK type", async () => {
      const body = {
        type: "BREAK" as const,
        startDate: "2026-04-01T12:00:00Z",
        endDate: "2026-04-01T13:00:00Z",
        title: "Lunch Break",
      };

      const result = await scheduleExceptionService.createException(
        professionalId,
        body,
      );

      expect(result.type).toBe("BREAK");
    });
  });

  describe("getException", () => {
    it("should retrieve an exception by id", async () => {
      const created = await scheduleExceptionService.createException(
        professionalId,
        {
          type: "BLOCK" as const,
          startDate: "2026-04-01T00:00:00Z",
          endDate: "2026-04-02T00:00:00Z",
          title: "Holiday",
        },
      );

      const retrieved = await scheduleExceptionService.getException(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe("Holiday");
    });

    it("should throw error if exception not found", async () => {
      await expect(
        scheduleExceptionService.getException("non-existent-id"),
      ).rejects.toThrow("Schedule exception not found");
    });
  });

  describe("getExceptionsByProfessional", () => {
    it("should retrieve all exceptions for a professional", async () => {
      await scheduleExceptionService.createException(professionalId, {
        type: "BLOCK" as const,
        startDate: "2026-04-01T00:00:00Z",
        endDate: "2026-04-02T00:00:00Z",
        title: "Holiday 1",
      });

      await scheduleExceptionService.createException(professionalId, {
        type: "BREAK" as const,
        startDate: "2026-04-05T12:00:00Z",
        endDate: "2026-04-05T13:00:00Z",
        title: "Lunch Break",
      });

      const exceptions =
        await scheduleExceptionService.getExceptionsByProfessional(
          professionalId,
        );

      expect(exceptions).toHaveLength(2);
    });

    it("should throw error if professional does not exist", async () => {
      await expect(
        scheduleExceptionService.getExceptionsByProfessional("non-existent-id"),
      ).rejects.toThrow("Professional not found");
    });
  });

  describe("updateException", () => {
    it("should update an exception", async () => {
      const created = await scheduleExceptionService.createException(
        professionalId,
        {
          type: "BLOCK" as const,
          startDate: "2026-04-01T00:00:00Z",
          endDate: "2026-04-02T00:00:00Z",
          title: "Holiday",
        },
      );

      const updated = await scheduleExceptionService.updateException(
        created.id,
        professionalId,
        {
          title: "Updated Holiday",
        },
      );

      expect(updated.title).toBe("Updated Holiday");
      expect(updated.type).toBe("BLOCK");
    });

    it("should throw error if trying to update with wrong professional", async () => {
      const created = await scheduleExceptionService.createException(
        professionalId,
        {
          type: "BLOCK" as const,
          startDate: "2026-04-01T00:00:00Z",
          endDate: "2026-04-02T00:00:00Z",
          title: "Holiday",
        },
      );

      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@test.com`,
          name: "Other Professional",
          password: "hashed_password_123",
          role: "PROFESSIONAL",
        },
      });

      try {
        await expect(
          scheduleExceptionService.updateException(created.id, otherUser.id, {
            title: "Hacked Title",
          }),
        ).rejects.toThrow();
      } finally {
        await prisma.scheduleException.deleteMany({
          where: { professionalId: otherUser.id },
        });
        await prisma.user.deleteMany({ where: { id: otherUser.id } });
      }
    });
  });

  describe("deleteException", () => {
    it("should delete an exception", async () => {
      const created = await scheduleExceptionService.createException(
        professionalId,
        {
          type: "BLOCK" as const,
          startDate: "2026-04-01T00:00:00Z",
          endDate: "2026-04-02T00:00:00Z",
          title: "Holiday",
        },
      );

      await scheduleExceptionService.deleteException(
        created.id,
        professionalId,
      );

      await expect(
        scheduleExceptionService.getException(created.id),
      ).rejects.toThrow("Schedule exception not found");
    });
  });
});
