import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '../../src/lib/prisma';
import {
    cancelAppointment, confirmAppointment, createClientAppointment, rejectAppointment
} from '../../src/services/appointment.service';

describe("Appointment Confirmation Flow", () => {
  let companyWithAutoConfirm: { id: string };
  let companyWithoutAutoConfirm: { id: string };
  let client: { id: string };
  let professional: { id: string };
  let admin: { id: string };
  let service: { id: string };

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: {
        email: `owner-${Date.now()}@test.com`,
        name: "Company Owner",
        password: "hashed",
        role: "COMPANY_OWNER",
      },
    });

    companyWithAutoConfirm = await prisma.company.create({
      data: {
        name: "Company With Auto",
        slug: `auto-${Date.now()}`,
        timezone: "UTC",
        autoConfirm: true,
        ownerId: owner.id,
      },
    });

    companyWithoutAutoConfirm = await prisma.company.create({
      data: {
        name: "Company Without Auto",
        slug: `manual-${Date.now()}`,
        timezone: "UTC",
        autoConfirm: false,
        ownerId: owner.id,
      },
    });

    client = await prisma.user.create({
      data: {
        email: `client-${Date.now()}@test.com`,
        name: "Test Client",
        password: "hashed",
        role: "CLIENT",
      },
    });

    professional = await prisma.user.create({
      data: {
        email: `prof-${Date.now()}@test.com`,
        name: "Test Prof",
        password: "hashed",
        role: "PROFESSIONAL",
        companyId: companyWithoutAutoConfirm.id,
      },
    });

    admin = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        name: "Test Admin",
        password: "hashed",
        role: "ADMIN",
      },
    });

    service = await prisma.service.create({
      data: {
        companyId: companyWithoutAutoConfirm.id,
        name: "Test Service",
        duration: 30,
      },
    });

    await prisma.professionalService.create({
      data: {
        professionalId: professional.id,
        serviceId: service.id,
        price: 100.0,
      },
    });

    await prisma.availability.create({
      data: {
        professionalId: professional.id,
        weekday: 1,
        startTime: "09:00",
        endTime: "18:00",
      },
    });
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({});
    await prisma.professionalService.deleteMany({});
    await prisma.availability.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe("CLIENT creates", () => {
    it("should create CONFIRMED when autoConfirm=true", async () => {
      const prof = await prisma.user.create({
        data: {
          email: `prof-auto-${Date.now()}@test.com`,
          name: "Prof Auto",
          password: "hashed",
          role: "PROFESSIONAL",
          companyId: companyWithAutoConfirm.id,
        },
      });

      const svc = await prisma.service.create({
        data: {
          companyId: companyWithAutoConfirm.id,
          name: "AutoConfirm Service",
          duration: 30,
        },
      });

      await prisma.professionalService.create({
        data: { professionalId: prof.id, serviceId: svc.id, price: 50 },
      });

      await prisma.availability.create({
        data: {
          professionalId: prof.id,
          weekday: 1,
          startTime: "09:00",
          endTime: "18:00",
        },
      });

      const appt = await createClientAppointment(
        {
          companyId: companyWithAutoConfirm.id,
          clientId: client.id,
          professionalId: prof.id,
          serviceId: svc.id,
          date: new Date("2026-04-06T00:00:00Z"),
          startTime: "10:00",
          endTime: "10:30",
        },
        { actorId: client.id, actorRole: "CLIENT" },
      );

      expect(appt.status).toBe("CONFIRMED");
      expect(appt.pendingApprovalFrom).toBeNull();
    });

    it("should create PENDING_PROFESSIONAL_CONFIRMATION when autoConfirm=false", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-04-13T00:00:00Z"),
          startTime: "10:00",
          endTime: "10:30",
        },
        { actorId: client.id, actorRole: "CLIENT" },
      );

      expect(appt.status).toBe("PENDING_PROFESSIONAL_CONFIRMATION");
      expect(appt.pendingApprovalFrom).toBe("PROFESSIONAL");
    });
  });

  describe("INTERNAL creates", () => {
    it("PROFESSIONAL creates → PENDING_CLIENT_CONFIRMATION", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-04-20T00:00:00Z"),
          startTime: "11:00",
          endTime: "11:30",
        },
        { actorId: professional.id, actorRole: "PROFESSIONAL" },
      );

      expect(appt.status).toBe("PENDING_CLIENT_CONFIRMATION");
      expect(appt.pendingApprovalFrom).toBe("CLIENT");
    });

    it("ADMIN creates → PENDING_CLIENT_CONFIRMATION", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-04-27T00:00:00Z"),
          startTime: "12:00",
          endTime: "12:30",
        },
        { actorId: admin.id, actorRole: "ADMIN" },
      );

      expect(appt.status).toBe("PENDING_CLIENT_CONFIRMATION");
      expect(appt.pendingApprovalFrom).toBe("CLIENT");
    });
  });

  describe("Confirmations", () => {
    it("PROFESSIONAL confirms PENDING_PROFESSIONAL_CONFIRMATION", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-05-04T00:00:00Z"),
          startTime: "10:00",
          endTime: "10:30",
        },
        { actorId: client.id, actorRole: "CLIENT" },
      );

      expect(appt.confirmedAt).toBeNull();
      expect(appt.confirmedByUserId).toBeNull();

      const confirmed = await confirmAppointment(appt.id, {
        actorId: professional.id,
        actorRole: "PROFESSIONAL",
      });

      expect(confirmed.status).toBe("CONFIRMED");
      expect(confirmed.pendingApprovalFrom).toBeNull();
      expect(confirmed.confirmedAt).not.toBeNull();
      expect(confirmed.confirmedByUserId).toBe(professional.id);
    });

    it("CLIENT confirms PENDING_CLIENT_CONFIRMATION", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-05-11T00:00:00Z"),
          startTime: "14:00",
          endTime: "14:30",
        },
        { actorId: professional.id, actorRole: "PROFESSIONAL" },
      );

      const confirmed = await confirmAppointment(appt.id, {
        actorId: client.id,
        actorRole: "CLIENT",
      });

      expect(confirmed.status).toBe("CONFIRMED");
      expect(confirmed.pendingApprovalFrom).toBeNull();
      expect(confirmed.confirmedAt).not.toBeNull();
      expect(confirmed.confirmedByUserId).toBe(client.id);
    });

    it("prevents wrong role from confirming", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-05-18T00:00:00Z"),
          startTime: "15:00",
          endTime: "15:30",
        },
        { actorId: professional.id, actorRole: "PROFESSIONAL" },
      );

      try {
        await confirmAppointment(appt.id, {
          actorId: professional.id,
          actorRole: "PROFESSIONAL",
        });
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toContain("Only the client");
      }
    });
  });

  describe("Rejections", () => {
    it("CLIENT rejects PENDING_CLIENT_CONFIRMATION", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-05-25T00:00:00Z"),
          startTime: "10:00",
          endTime: "10:30",
        },
        { actorId: professional.id, actorRole: "PROFESSIONAL" },
      );

      expect(appt.rejectedAt).toBeNull();
      expect(appt.rejectedByUserId).toBeNull();

      const rejected = await rejectAppointment(
        appt.id,
        { rejectionReason: "Not available" },
        { actorId: client.id, actorRole: "CLIENT" },
      );

      expect(rejected.status).toBe("REJECTED");
      expect(rejected.rejectionReason).toBe("Not available");
      expect(rejected.rejectedByUserId).toBe(client.id);
      expect(rejected.rejectedAt).not.toBeNull();
    });

    it("PROFESSIONAL rejects PENDING_PROFESSIONAL_CONFIRMATION", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-06-01T00:00:00Z"),
          startTime: "11:00",
          endTime: "11:30",
        },
        { actorId: client.id, actorRole: "CLIENT" },
      );

      const rejected = await rejectAppointment(
        appt.id,
        { rejectionReason: "Schedule conflict" },
        { actorId: professional.id, actorRole: "PROFESSIONAL" },
      );

      expect(rejected.status).toBe("REJECTED");
      expect(rejected.rejectionReason).toBe("Schedule conflict");
    });

    it("prevents rejection after confirmation", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-06-08T00:00:00Z"),
          startTime: "16:00",
          endTime: "16:30",
        },
        { actorId: client.id, actorRole: "CLIENT" },
      );

      await confirmAppointment(appt.id, {
        actorId: professional.id,
        actorRole: "PROFESSIONAL",
      });

      try {
        await rejectAppointment(
          appt.id,
          { rejectionReason: "Changed mind" },
          { actorId: client.id, actorRole: "CLIENT" },
        );
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toContain("not pending any approval");
      }
    });
  });

  describe("Overbooking prevention", () => {
    it("revalidates slot availability before confirming", async () => {
      const first = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-06-15T00:00:00Z"),
          startTime: "10:00",
          endTime: "10:30",
        },
        { actorId: client.id, actorRole: "CLIENT" },
      );

      const confirmed = await confirmAppointment(first.id, {
        actorId: professional.id,
        actorRole: "PROFESSIONAL",
      });

      expect(confirmed.status).toBe("CONFIRMED");
      expect(confirmed.pendingApprovalFrom).toBeNull();
    });
  });

  describe("Availability validation", () => {
    it("fails when trying to book on a weekday without availability", async () => {
      try {
        await createClientAppointment(
          {
            companyId: companyWithoutAutoConfirm.id,
            clientId: client.id,
            professionalId: professional.id,
            serviceId: service.id,
            date: new Date("2026-06-16T00:00:00Z"),
            startTime: "10:00",
            endTime: "10:30",
          },
          { actorId: client.id, actorRole: "CLIENT" },
        );
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toContain(
          "Selected time is outside professional availability",
        );
      }
    });

    it("fails when trying to book outside available hours", async () => {
      try {
        await createClientAppointment(
          {
            companyId: companyWithoutAutoConfirm.id,
            clientId: client.id,
            professionalId: professional.id,
            serviceId: service.id,
            date: new Date("2026-06-22T00:00:00Z"),
            startTime: "08:00",
            endTime: "08:30",
          },
          { actorId: client.id, actorRole: "CLIENT" },
        );
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toContain(
          "Selected time is outside professional availability",
        );
      }
    });
  });

  describe("Cancellations", () => {
    it("CLIENT cancels SCHEDULED appointment with reason", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-06-22T00:00:00Z"),
          startTime: "10:00",
          endTime: "10:30",
        },
        { actorId: client.id, actorRole: "CLIENT" },
      );

      expect(appt.cancelledAt).toBeNull();
      expect(appt.cancelledByUserId).toBeNull();
      expect(appt.cancelReason).toBeNull();

      const cancelled = await cancelAppointment(
        appt.id,
        { cancelReason: "Client cannot travel" },
        { actorId: client.id, actorRole: "CLIENT" },
      );

      expect(cancelled.status).toBe("CANCELLED");
      expect(cancelled.cancelledByUserId).toBe(client.id);
      expect(cancelled.cancelReason).toBe("Client cannot travel");
      expect(cancelled.cancelledAt).not.toBeNull();
    });

    it("PROFESSIONAL cancels CONFIRMED appointment", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-06-29T00:00:00Z"),
          startTime: "11:00",
          endTime: "11:30",
        },
        { actorId: client.id, actorRole: "CLIENT" },
      );

      await confirmAppointment(appt.id, {
        actorId: professional.id,
        actorRole: "PROFESSIONAL",
      });

      const cancelled = await cancelAppointment(
        appt.id,
        { cancelReason: "Professional emergency" },
        { actorId: professional.id, actorRole: "PROFESSIONAL" },
      );

      expect(cancelled.status).toBe("CANCELLED");
      expect(cancelled.cancelledByUserId).toBe(professional.id);
      expect(cancelled.cancelReason).toBe("Professional emergency");
    });

    it("prevents canceling COMPLETED appointment", async () => {
      const appt = await createClientAppointment(
        {
          companyId: companyWithoutAutoConfirm.id,
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          date: new Date("2026-07-06T00:00:00Z"),
          startTime: "15:00",
          endTime: "15:30",
        },
        { actorId: client.id, actorRole: "CLIENT" },
      );

      await confirmAppointment(appt.id, {
        actorId: professional.id,
        actorRole: "PROFESSIONAL",
      });

      await prisma.appointment.update({
        where: { id: appt.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      try {
        await cancelAppointment(
          appt.id,
          { cancelReason: "Too late" },
          { actorId: client.id, actorRole: "CLIENT" },
        );
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toContain("already finalized");
      }
    });
  });
});
