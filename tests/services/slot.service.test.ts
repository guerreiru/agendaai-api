import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/lib/prisma';
import { slotService } from '../../src/services/slot.service';

describe("SlotService", () => {
  let ownerId: string;
  let professionalId: string;
  let companyId: string;
  let serviceId: string;
  let clientId: string;

  beforeEach(async () => {
    // Create company owner
    const owner = await prisma.user.create({
      data: {
        email: `owner-${Date.now()}@test.com`,
        name: "Company Owner",
        password: "hashed_password_123",
        role: "COMPANY_OWNER",
      },
    });
    ownerId = owner.id;

    // Create company
    const company = await prisma.company.create({
      data: {
        name: "Test Company",
        slug: `test-company-${Date.now()}`,
        ownerId: owner.id,
        timezone: "America/Sao_Paulo",
      },
    });
    companyId = company.id;

    // Create professional
    const professional = await prisma.user.create({
      data: {
        email: `prof-${Date.now()}@test.com`,
        name: "Test Professional",
        password: "hashed_password_123",
        role: "PROFESSIONAL",
        companyId,
      },
    });
    professionalId = professional.id;

    // Create service
    const service = await prisma.service.create({
      data: {
        companyId,
        name: "Haircut",
        description: "Professional haircut",
        duration: 30,
      },
    });
    serviceId = service.id;

    // Associate professional with service
    await prisma.professionalService.create({
      data: {
        professionalId,
        serviceId,
        price: 50.0,
      },
    });

    // Create availability for Monday (1) 09:00-18:00
    await prisma.availability.create({
      data: {
        professionalId,
        weekday: 1, // Monday
        startTime: "09:00",
        endTime: "18:00",
      },
    });

    // Create client
    const client = await prisma.user.create({
      data: {
        email: `client-${Date.now()}@test.com`,
        name: "Test Client",
        password: "hashed_password_123",
        role: "CLIENT",
      },
    });
    clientId = client.id;
  });

  afterEach(async () => {
    // Cleanup with error handling
    try {
      await prisma.appointment.deleteMany({
        where: {
          OR: [{ professionalId }, { clientId }, { companyId }],
        },
      });
      await prisma.scheduleException.deleteMany({ where: { professionalId } });
      await prisma.availability.deleteMany({ where: { professionalId } });
      await prisma.professionalService.deleteMany({
        where: { professionalId },
      });
      await prisma.service.deleteMany({ where: { companyId } });
      await prisma.company.deleteMany({ where: { id: companyId } });
      await prisma.user.deleteMany({
        where: {
          id: { in: [professionalId, clientId, ownerId] },
        },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("getAvailableSlots", () => {
    it("should return available slots for a professional on their working day", async () => {
      const dateStr = "2026-04-06"; // Monday

      const result = await slotService.getAvailableSlots(
        professionalId,
        serviceId,
        dateStr,
      );

      expect(result.professionalId).toBe(professionalId);
      expect(result.serviceId).toBe(serviceId);
      expect(result.slots.length).toBeGreaterThan(0);
      expect(result.slots[0]).toHaveProperty("startTime");
      expect(result.slots[0]).toHaveProperty("endTime");
      expect(result.slots[0]).toHaveProperty("isAvailable");
    });

    it("should return no slots for unavailable day", async () => {
      const dateStr = "2026-04-05"; // Sunday

      const result = await slotService.getAvailableSlots(
        professionalId,
        serviceId,
        dateStr,
      );

      expect(result.slots).toHaveLength(0);
    });

    it("should exclude slots with existing appointments", async () => {
      const dateStr = "2026-04-06"; // Monday

      // Create an appointment at 10:00-10:30
      const appointmentDate = new Date(`${dateStr}T00:00:00.000Z`);

      await prisma.appointment.create({
        data: {
          companyId,
          clientId,
          professionalId,
          serviceId,
          date: appointmentDate,
          startTime: "10:00",
          endTime: "10:30",
          price: 50.0,
          createdByRole: "CLIENT",
          createdByUserId: clientId,
        },
      });

      const result = await slotService.getAvailableSlots(
        professionalId,
        serviceId,
        dateStr,
      );

      // Slot with conflict should not be returned
      const tenOClockSlot = result.slots.find((s) => s.startTime === "10:00");
      expect(tenOClockSlot).toBeUndefined();
    });

    it("should exclude slots blocked by BLOCK exception", async () => {
      const dateStr = "2026-04-06"; // Monday

      // Create a BLOCK exception for the entire day
      const blockStart = new Date(`${dateStr}T00:00:00.000Z`);
      const blockEnd = new Date(`${dateStr}T23:59:59.999Z`);

      await prisma.scheduleException.create({
        data: {
          professionalId,
          type: "BLOCK",
          startDate: blockStart,
          endDate: blockEnd,
          title: "Day off",
        },
      });

      const result = await slotService.getAvailableSlots(
        professionalId,
        serviceId,
        dateStr,
      );

      expect(result.slots).toHaveLength(0);
    });

    it("should throw error if professional does not exist", async () => {
      const dateStr = "2026-04-06";

      await expect(
        slotService.getAvailableSlots("non-existent-id", serviceId, dateStr),
      ).rejects.toThrow("Professional not found");
    });

    it("should throw error if service does not exist", async () => {
      const dateStr = "2026-04-06";

      await expect(
        slotService.getAvailableSlots(
          professionalId,
          "non-existent-id",
          dateStr,
        ),
      ).rejects.toThrow("Service not found");
    });

    it("should throw error if professional does not offer service", async () => {
      // Create a different service
      const otherService = await prisma.service.create({
        data: {
          companyId,
          name: "Massage",
          description: "Professional massage",
          duration: 60,
        },
      });

      const dateStr = "2026-04-06";

      try {
        await expect(
          slotService.getAvailableSlots(
            professionalId,
            otherService.id,
            dateStr,
          ),
        ).rejects.toThrow("Professional does not offer this service");
      } finally {
        await prisma.service.delete({ where: { id: otherService.id } });
      }
    });

    it("should return slots with correct time format", async () => {
      const dateStr = "2026-04-06"; // Monday

      const result = await slotService.getAvailableSlots(
        professionalId,
        serviceId,
        dateStr,
      );

      // Verify time format (HH:MM)
      result.slots.forEach((slot) => {
        expect(slot.startTime).toMatch(/^\d{2}:\d{2}$/);
        expect(slot.endTime).toMatch(/^\d{2}:\d{2}$/);
      });
    });
  });
});
