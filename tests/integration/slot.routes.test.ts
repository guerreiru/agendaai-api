import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";

describe("Slot Routes", () => {
  let accessToken: string;
  let ownerId: string;
  let userId: string;
  let professionalId: string;
  let companyId: string;
  let serviceId: string;
  let clientId: string;

  beforeEach(async () => {
    const uid = randomUUID();

    // Create company owner
    const owner = await prisma.user.create({
      data: {
        email: `owner-${uid}@test.com`,
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
        slug: `test-company-${uid}`,
        ownerId: owner.id,
        timezone: "America/Sao_Paulo",
      },
    });
    companyId = company.id;

    // Create professional
    const professional = await prisma.user.create({
      data: {
        email: `prof-${uid}@test.com`,
        name: "Test Professional",
        password: "hashed_password_123",
        role: "PROFESSIONAL",
        companyId,
      },
    });
    professionalId = professional.id;
    userId = professional.id;

    // Create token
    accessToken = jwt.sign(
      {
        userId: professional.id,
        userEmail: professional.email,
        userRole: professional.role,
      },
      process.env.JWT_SECRET || "test_secret",
      { expiresIn: "15m" },
    );

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

    // Create availability for all weekdays 09:00-18:00
    for (let weekday = 0; weekday < 7; weekday++) {
      await prisma.availability.create({
        data: {
          professionalId,
          weekday,
          startTime: "09:00",
          endTime: "18:00",
        },
      });
    }

    // Create client
    const client = await prisma.user.create({
      data: {
        email: `client-${uid}@test.com`,
        name: "Test Client",
        password: "hashed_password_123",
        role: "CLIENT",
      },
    });
    clientId = client.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.appointment.deleteMany({
      where: {
        OR: [{ professionalId }, { clientId }, { companyId }],
      },
    });
    await prisma.scheduleException.deleteMany({ where: { professionalId } });
    await prisma.availability.deleteMany({ where: { professionalId } });
    await prisma.professionalService.deleteMany({ where: { professionalId } });
    await prisma.service.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.user.deleteMany({
      where: {
        id: { in: [professionalId, clientId, ownerId] },
      },
    });
  });

  describe("GET /slots", () => {
    it("should get available slots", async () => {
      const dateStr = "2026-04-06";

      const response = await request(app).get("/slots").query({
        professionalId,
        serviceId,
        date: dateStr,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("professionalId", professionalId);
      expect(response.body).toHaveProperty("serviceId", serviceId);
      expect(response.body).toHaveProperty("date", dateStr);
      expect(Array.isArray(response.body.slots)).toBe(true);
    });

    it("should return 400 without required parameters", async () => {
      const response = await request(app).get("/slots").query({
        // missing all parameters
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 with invalid date", async () => {
      const response = await request(app).get("/slots").query({
        professionalId,
        serviceId,
        date: "invalid-date",
      });

      expect(response.status).toBe(400);
    });

    it("should return 404 if professional does not exist", async () => {
      const dateStr = "2026-04-06";

      const response = await request(app).get("/slots").query({
        professionalId: "non-existent-id",
        serviceId,
        date: dateStr,
      });

      expect(response.status).toBe(404);
    });

    it("should return 404 if service does not exist", async () => {
      const dateStr = "2026-04-06";

      const response = await request(app).get("/slots").query({
        professionalId,
        serviceId: "non-existent-id",
        date: dateStr,
      });

      expect(response.status).toBe(404);
    });

    it("should return empty slots for unavailable day", async () => {
      const dateStr = "2026-04-06";
      const weekday = new Date(`${dateStr}T00:00:00.000Z`).getUTCDay();

      await prisma.availability.deleteMany({
        where: {
          professionalId,
          weekday,
        },
      });

      const response = await request(app).get("/slots").query({
        professionalId,
        serviceId,
        date: dateStr,
      });

      expect(response.status).toBe(200);
      expect(response.body.slots).toHaveLength(0);
    });

    it("should exclude booked appointment slots", async () => {
      const dateStr = "2026-04-06";

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

      const response = await request(app).get("/slots").query({
        professionalId,
        serviceId,
        date: dateStr,
      });

      expect(response.status).toBe(200);
      const tenOClockSlot = response.body.slots.find(
        (s: any) => s.startTime === "10:00",
      );
      expect(tenOClockSlot).toBeUndefined();
    });

    it("should work without authentication token", async () => {
      const dateStr = "2026-04-06";

      const response = await request(app).get("/slots").query({
        professionalId,
        serviceId,
        date: dateStr,
      });

      expect(response.status).toBe(200);
    });

    it("should work with authentication token", async () => {
      const dateStr = "2026-04-06";

      const response = await request(app)
        .get("/slots")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({
          professionalId,
          serviceId,
          date: dateStr,
        });

      expect(response.status).toBe(200);
    });
  });
});
