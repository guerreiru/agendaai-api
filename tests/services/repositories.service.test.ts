import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  company: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  service: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  professionalService: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  availability: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  appointment: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  refreshSession: {
    create: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  scheduleException: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

import * as appointmentRepository from "../../src/repositories/appointment.repository";
import * as availabilityRepository from "../../src/repositories/availability.repository";
import * as companyRepository from "../../src/repositories/company.repository";
import * as professionalServiceRepository from "../../src/repositories/professional-service.repository";
import * as refreshSessionRepository from "../../src/repositories/refresh-session.repository";
import { AppError } from "../../src/utils/app-error";
import {
  ScheduleExceptionRepository,
  scheduleExceptionRepository,
} from "../../src/repositories/schedule-exception.repository";
import * as serviceRepository from "../../src/repositories/service.repository";
import * as userRepository from "../../src/repositories/user.repository";

describe("repositories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("company.repository", () => {
    it("queries company by id", async () => {
      await companyRepository.findCompanyById("c-1");

      expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { id: "c-1" },
      });
    });

    it("builds search filter only when search term is present", async () => {
      await companyRepository.findPublicCompaniesBySearch("  barbearia ");

      expect(prismaMock.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            name: { contains: "barbearia", mode: "insensitive" },
          },
          take: 20,
        }),
      );
    });

    it("uses empty where for empty search term", async () => {
      await companyRepository.findPublicCompaniesBySearch("   ");

      expect(prismaMock.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it("queries company by slug and public profile", async () => {
      await companyRepository.findCompanyBySlug("empresa-x");
      await companyRepository.findCompanyPublicProfileBySlug("empresa-x");

      expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { slug: "empresa-x" },
      });
      expect(prismaMock.company.findUnique).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { slug: "empresa-x" },
          select: expect.any(Object),
        }),
      );
    });

    it("runs company list and mutations", async () => {
      await companyRepository.findCompanies();
      await companyRepository.createCompany({
        name: "Empresa X",
        slug: "empresa-x",
        ownerId: "owner-1",
        timezone: "UTC",
      });
      await companyRepository.updateCompany("c-1", { name: "Novo" });
      await companyRepository.deleteCompany("c-1");

      expect(prismaMock.company.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
      expect(prismaMock.company.create).toHaveBeenCalled();
      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: "c-1" },
        data: { name: "Novo" },
      });
      expect(prismaMock.company.delete).toHaveBeenCalledWith({
        where: { id: "c-1" },
      });
    });
  });

  describe("service.repository", () => {
    it("queries service by id and list", async () => {
      await serviceRepository.findServiceById("s-1");
      await serviceRepository.findServices();

      expect(prismaMock.service.findUnique).toHaveBeenCalledWith({
        where: { id: "s-1" },
      });
      expect(prismaMock.service.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
    });

    it("queries services by company", async () => {
      await serviceRepository.findServicesByCompany("company-1");

      expect(prismaMock.service.findMany).toHaveBeenCalledWith({
        where: { companyId: "company-1" },
        orderBy: { createdAt: "desc" },
      });
    });

    it("updates service by id", async () => {
      await serviceRepository.updateService("s-1", { name: "Corte" });

      expect(prismaMock.service.update).toHaveBeenCalledWith({
        where: { id: "s-1" },
        data: { name: "Corte" },
      });
    });

    it("creates and deletes service", async () => {
      await serviceRepository.createService({
        companyId: "c-1",
        name: "Corte",
        duration: 30,
      });
      await serviceRepository.deleteService("s-1");

      expect(prismaMock.service.create).toHaveBeenCalled();
      expect(prismaMock.service.delete).toHaveBeenCalledWith({
        where: { id: "s-1" },
      });
    });
  });

  describe("professional-service.repository", () => {
    it("queries by id and list", async () => {
      await professionalServiceRepository.findProfessionalServiceById("ps-1");
      await professionalServiceRepository.findProfessionalServices();

      expect(prismaMock.professionalService.findUnique).toHaveBeenCalledWith({
        where: { id: "ps-1" },
      });
      expect(prismaMock.professionalService.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
    });

    it("queries by composite unique key", async () => {
      await professionalServiceRepository.findProfessionalServiceByProfessionalAndService(
        "p-1",
        "s-1",
      );

      expect(prismaMock.professionalService.findUnique).toHaveBeenCalledWith({
        where: {
          professionalId_serviceId: {
            professionalId: "p-1",
            serviceId: "s-1",
          },
        },
      });
    });

    it("filters out inactive records when requested", async () => {
      await professionalServiceRepository.findProfessionalServicesByCompany(
        "company-1",
        undefined,
        false,
      );

      expect(prismaMock.professionalService.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          service: {
            companyId: "company-1",
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("adds service filter when serviceId is provided", async () => {
      await professionalServiceRepository.findProfessionalServicesByCompany(
        "company-1",
        "s-1",
      );

      expect(prismaMock.professionalService.findMany).toHaveBeenCalledWith({
        where: {
          serviceId: "s-1",
          service: {
            companyId: "company-1",
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("runs create, update and delete operations", async () => {
      await professionalServiceRepository.createProfessionalService({
        professionalId: "p-1",
        serviceId: "s-1",
        price: 90,
      });
      await professionalServiceRepository.updateProfessionalService("ps-1", {
        isActive: false,
      });
      await professionalServiceRepository.deleteProfessionalService("ps-1");

      expect(prismaMock.professionalService.create).toHaveBeenCalled();
      expect(prismaMock.professionalService.update).toHaveBeenCalledWith({
        where: { id: "ps-1" },
        data: { isActive: false },
      });
      expect(prismaMock.professionalService.delete).toHaveBeenCalledWith({
        where: { id: "ps-1" },
      });
    });
  });

  describe("availability.repository", () => {
    it("queries availability by id and list", async () => {
      await availabilityRepository.findAvailabilityById("a-1");
      await availabilityRepository.findAvailabilities();

      expect(prismaMock.availability.findUnique).toHaveBeenCalledWith({
        where: { id: "a-1" },
      });
      expect(prismaMock.availability.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
    });

    it("queries professional availabilities", async () => {
      await availabilityRepository.findAvailabilitiesByProfessional("p-1");
      await availabilityRepository.findAvailabilityByProfessionalAndWeekday(
        "p-1",
        2,
      );

      expect(prismaMock.availability.findMany).toHaveBeenCalledWith({
        where: { professionalId: "p-1" },
        orderBy: { weekday: "asc" },
      });
      expect(prismaMock.availability.findFirst).toHaveBeenCalledWith({
        where: {
          professionalId: "p-1",
          weekday: 2,
        },
        orderBy: { startTime: "asc" },
      });
    });

    it("queries overlapping availability without excludeId", async () => {
      await availabilityRepository.findOverlappingAvailability(
        "p-1",
        1,
        "09:00",
        "10:00",
      );

      expect(prismaMock.availability.findFirst).toHaveBeenCalledWith({
        where: {
          professionalId: "p-1",
          weekday: 1,
          isActive: true,
          startTime: { lt: "10:00" },
          endTime: { gt: "09:00" },
        },
      });
    });

    it("queries overlapping availability with excludeId", async () => {
      await availabilityRepository.findOverlappingAvailability(
        "p-1",
        1,
        "09:00",
        "10:00",
        "a-1",
      );

      expect(prismaMock.availability.findFirst).toHaveBeenCalledWith({
        where: {
          professionalId: "p-1",
          weekday: 1,
          isActive: true,
          startTime: { lt: "10:00" },
          endTime: { gt: "09:00" },
          NOT: { id: "a-1" },
        },
      });
    });

    it("queries active availabilities by weekday", async () => {
      await availabilityRepository.findAvailabilitiesByProfessionalAndWeekday(
        "p-1",
        2,
      );

      expect(prismaMock.availability.findMany).toHaveBeenCalledWith({
        where: {
          professionalId: "p-1",
          weekday: 2,
          isActive: true,
        },
        orderBy: { startTime: "asc" },
      });
    });

    it("runs create, update and delete availability", async () => {
      await availabilityRepository.createAvailability({
        professionalId: "p-1",
        weekday: 1,
        startTime: "09:00",
        endTime: "18:00",
      });
      await availabilityRepository.updateAvailability("a-1", {
        isActive: false,
      });
      await availabilityRepository.deleteAvailability("a-1");

      expect(prismaMock.availability.create).toHaveBeenCalled();
      expect(prismaMock.availability.update).toHaveBeenCalledWith({
        where: { id: "a-1" },
        data: { isActive: false },
      });
      expect(prismaMock.availability.delete).toHaveBeenCalledWith({
        where: { id: "a-1" },
      });
    });
  });

  describe("user.repository", () => {
    it("queries user by email and id", async () => {
      await userRepository.findUserByEmail("ana@email.com");
      await userRepository.findUserById("u-1");

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: "ana@email.com" },
      });
      expect(prismaMock.user.findUnique).toHaveBeenLastCalledWith({
        where: { id: "u-1" },
        omit: { password: true },
        include: {
          ownedCompany: true,
          professionalServices: true,
        },
      });
    });

    it("creates user with only required fields", async () => {
      await userRepository.createUser({
        name: "Ana",
        email: "ana@example.com",
        password: "secret",
        role: "CLIENT",
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: "Ana",
          email: "ana@example.com",
          password: "secret",
          role: "CLIENT",
        },
        omit: {
          password: true,
        },
      });
    });

    it("creates user with optional fields", async () => {
      await userRepository.createUser({
        name: "Ana",
        email: "ana@example.com",
        password: "secret",
        role: "PROFESSIONAL",
        companyId: "c-1",
        phone: "+5511999999999",
        displayName: "Ana Cabeleireira",
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: "Ana",
          email: "ana@example.com",
          password: "secret",
          role: "PROFESSIONAL",
          companyId: "c-1",
          phone: "+5511999999999",
          displayName: "Ana Cabeleireira",
        },
        omit: {
          password: true,
        },
      });
    });

    it("queries clients by phone", async () => {
      await userRepository.findClientUsersByPhone("+5511999999999");

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: {
          role: "CLIENT",
          phone: "+5511999999999",
        },
        orderBy: { createdAt: "desc" },
        omit: {
          password: true,
        },
      });
    });

    it("runs user list and mutation operations", async () => {
      await userRepository.findUsers();
      await userRepository.updateUser("u-1", { name: "Novo" });
      await userRepository.deleteUser("u-1");
      await userRepository.findUsersByCompanyId("c-1");
      await userRepository.findClientUsersByEmail("ana@email.com");

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        omit: { password: true },
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "u-1" },
        data: { name: "Novo" },
        omit: { password: true },
      });
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: "u-1" },
        omit: { password: true },
      });
    });
  });

  describe("appointment.repository", () => {
    it("queries appointment by id and lists", async () => {
      await appointmentRepository.findAppointmentById("app-1");
      await appointmentRepository.findAppointments();
      await appointmentRepository.findAppointmentsByClient("u-1");
      await appointmentRepository.findAppointmentsByProfessional("p-1");
      await appointmentRepository.findAppointmentsByCompany("c-1");

      expect(prismaMock.appointment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "app-1" } }),
      );
      expect(prismaMock.appointment.findMany).toHaveBeenCalled();
    });

    it("adds NOT filter when exclude id is provided", async () => {
      const date = new Date("2026-04-01T12:00:00.000Z");
      await appointmentRepository.findConflictingAppointments(
        "p-1",
        date,
        "09:00",
        "10:00",
        "app-1",
      );

      expect(prismaMock.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            professionalId: "p-1",
            NOT: { id: "app-1" },
          }),
        }),
      );
    });

    it("does not add NOT filter when exclude id is omitted", async () => {
      const date = new Date("2026-04-01T12:00:00.000Z");
      await appointmentRepository.findConflictingAppointments(
        "p-1",
        date,
        "09:00",
        "10:00",
      );

      expect(prismaMock.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            NOT: expect.anything(),
          }),
        }),
      );
    });

    it("converts string date when creating appointment", async () => {
      await appointmentRepository.createAppointment({
        clientId: "u-client",
        professionalId: "u-prof",
        companyId: "c-1",
        serviceId: "s-1",
        date: new Date("2026-04-20T00:00:00.000Z"),
        startTime: "09:00",
        endTime: "10:00",
        price: 100,
        status: "SCHEDULED",
        createdByRole: "CLIENT",
        createdByUserId: "u-client",
      });

      expect(prismaMock.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: new Date("2026-04-20T00:00:00.000Z"),
          }),
        }),
      );
    });

    it("expires past appointments and returns affected count", async () => {
      prismaMock.appointment.updateMany.mockResolvedValue({ count: 3 });

      const count = await appointmentRepository.expirePastAppointments(
        new Date("2026-04-01T10:30:00.000Z"),
      );

      expect(count).toBe(3);
      expect(prismaMock.appointment.updateMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: ["SCHEDULED", "CONFIRMED"],
          },
          OR: [
            {
              date: {
                lt: new Date("2026-04-01T00:00:00.000Z"),
              },
            },
            {
              date: new Date("2026-04-01T00:00:00.000Z"),
              endTime: {
                lte: "10:30",
              },
            },
          ],
        },
        data: {
          status: "NO_SHOW",
        },
      });
    });

    it("updates and deletes appointment", async () => {
      await appointmentRepository.updateAppointment("app-1", {
        status: "CONFIRMED",
      });
      await appointmentRepository.deleteAppointment("app-1");

      expect(prismaMock.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "app-1" },
          data: { status: "CONFIRMED" },
        }),
      );
      expect(prismaMock.appointment.delete).toHaveBeenCalledWith({
        where: { id: "app-1" },
      });
    });
  });

  describe("refresh-session.repository", () => {
    it("creates refresh session", async () => {
      const expiresAt = new Date("2026-05-01T00:00:00.000Z");
      await refreshSessionRepository.createRefreshSession({
        userId: "u-1",
        tokenHash: "hash",
        expiresAt,
      });

      expect(prismaMock.refreshSession.create).toHaveBeenCalledWith({
        data: {
          userId: "u-1",
          tokenHash: "hash",
          expiresAt,
        },
      });
    });

    it("revokes all refresh sessions by user id", async () => {
      await refreshSessionRepository.revokeAllRefreshSessionsByUserId("u-1");

      expect(prismaMock.refreshSession.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "u-1",
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
    });

    it("finds and revokes session by hash", async () => {
      await refreshSessionRepository.findActiveRefreshSessionByHash("hash-1");
      await refreshSessionRepository.revokeRefreshSessionByHash("hash-1");

      expect(prismaMock.refreshSession.findFirst).toHaveBeenCalledWith({
        where: {
          tokenHash: "hash-1",
          revokedAt: null,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
      });
      expect(prismaMock.refreshSession.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: "hash-1",
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
    });
  });

  describe("schedule-exception.repository", () => {
    const makeExceptionRecord = () => ({
      id: "exc-1",
      professionalId: "p-1",
      type: "BLOCK",
      startDate: new Date("2026-04-10T00:00:00.000Z"),
      endDate: new Date("2026-04-12T00:00:00.000Z"),
      title: "Ferias",
      description: null,
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    });

    it("creates and maps exception response", async () => {
      prismaMock.scheduleException.create.mockResolvedValue(
        makeExceptionRecord(),
      );

      const result = await scheduleExceptionRepository.create(
        "p-1",
        "BLOCK",
        "2026-04-10T00:00:00.000Z",
        "2026-04-12T00:00:00.000Z",
        "Ferias",
      );

      expect(result.startDate).toBe("2026-04-10T00:00:00.000Z");
      expect(prismaMock.scheduleException.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: null,
          startDate: new Date("2026-04-10T00:00:00.000Z"),
          endDate: new Date("2026-04-12T00:00:00.000Z"),
        }),
      });
    });

    it("returns null when schedule exception is not found", async () => {
      prismaMock.scheduleException.findUnique.mockResolvedValue(null);

      const result = await scheduleExceptionRepository.findById("missing");

      expect(result).toBeNull();
    });

    it("returns mapped rows for professional queries", async () => {
      prismaMock.scheduleException.findMany.mockResolvedValue([
        makeExceptionRecord(),
      ]);

      const byProfessional =
        await scheduleExceptionRepository.findByProfessionalId("p-1");
      const byRange =
        await scheduleExceptionRepository.findByProfessionalIdAndDateRange(
          "p-1",
          "2026-04-01T00:00:00.000Z",
          "2026-04-30T00:00:00.000Z",
        );

      expect(byProfessional).toHaveLength(1);
      expect(byRange).toHaveLength(1);
    });

    it("throws when updating exception from another professional", async () => {
      prismaMock.scheduleException.findUnique.mockResolvedValue({
        id: "exc-1",
        professionalId: "p-2",
      });

      await expect(
        scheduleExceptionRepository.update("exc-1", "p-1", {
          title: "Novo titulo",
        }),
      ).rejects.toBeInstanceOf(AppError);
    });

    it("updates schedule exception with transformed dates", async () => {
      const repository = new ScheduleExceptionRepository();
      prismaMock.scheduleException.findUnique.mockResolvedValue({
        id: "exc-1",
        professionalId: "p-1",
      });
      prismaMock.scheduleException.update.mockResolvedValue(
        makeExceptionRecord(),
      );

      await repository.update("exc-1", "p-1", {
        startDate: "2026-04-11T00:00:00.000Z",
        endDate: "2026-04-13T00:00:00.000Z",
        title: "Feriado",
      });

      expect(prismaMock.scheduleException.update).toHaveBeenCalledWith({
        where: { id: "exc-1" },
        data: {
          startDate: new Date("2026-04-11T00:00:00.000Z"),
          endDate: new Date("2026-04-13T00:00:00.000Z"),
          title: "Feriado",
        },
      });
    });

    it("throws when deleting exception from another professional", async () => {
      prismaMock.scheduleException.findUnique.mockResolvedValue({
        id: "exc-1",
        professionalId: "p-2",
      });

      await expect(
        scheduleExceptionRepository.delete("exc-1", "p-1"),
      ).rejects.toBeInstanceOf(AppError);
    });

    it("deletes schedule exception when it belongs to professional", async () => {
      prismaMock.scheduleException.findUnique.mockResolvedValue({
        id: "exc-1",
        professionalId: "p-1",
      });

      await scheduleExceptionRepository.delete("exc-1", "p-1");

      expect(prismaMock.scheduleException.delete).toHaveBeenCalledWith({
        where: { id: "exc-1" },
      });
    });
  });
});
