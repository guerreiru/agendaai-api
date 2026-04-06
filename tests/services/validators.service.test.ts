import { describe, expect, it } from "vitest";
import {
  validateCreateAppointmentBody,
  validateUpdateAppointmentBody,
} from "../../src/validators/appointment.validator";
import {
  validateLoginBody,
  validateRefreshTokenBody,
} from "../../src/validators/auth.validator";
import {
  validateCreateAvailabilityBody,
  validateUpdateAvailabilityBody,
} from "../../src/validators/availability.validator";
import {
  validateCreateCompanyBody,
  validateUpdateCompanyBody,
} from "../../src/validators/company.validator";
import {
  validateCreateProfessionalServiceBody,
  validateUpdateProfessionalServiceBody,
} from "../../src/validators/professional-service.validator";
import {
  validateCreateScheduleExceptionBody,
  validateGetSlotsParams,
  validateUpdateScheduleExceptionBody,
} from "../../src/validators/schedule-exception";
import {
  validateCreateServiceBody,
  validateUpdateServiceBody,
} from "../../src/validators/service.validator";
import {
  validateCreateUserBody,
  validateSearchUsersQuery,
  validateUpdateUserBody,
} from "../../src/validators/user.validator";

describe("validators", () => {
  describe("auth.validator", () => {
    it("normalizes valid login body", () => {
      expect(
        validateLoginBody({ email: "  USER@EMAIL.COM ", password: "abc123" }),
      ).toEqual({
        email: "user@email.com",
        password: "abc123",
      });
    });

    it("rejects invalid login body", () => {
      expect(() => validateLoginBody(null)).toThrow();
      expect(() =>
        validateLoginBody({ email: "bad", password: "x" }),
      ).toThrow();
      expect(() =>
        validateLoginBody({ email: "a@a.com", password: "   " }),
      ).toThrow();
    });

    it("handles refresh token body variants", () => {
      expect(validateRefreshTokenBody(null)).toEqual({});
      expect(validateRefreshTokenBody({})).toEqual({});
      expect(validateRefreshTokenBody({ refreshToken: "  token  " })).toEqual({
        refreshToken: "token",
      });
      expect(() => validateRefreshTokenBody({ refreshToken: "   " })).toThrow();
    });
  });

  describe("user.validator", () => {
    it("validates and normalizes create user body", () => {
      expect(
        validateCreateUserBody({
          name: " Ana ",
          email: " ANA@EMAIL.COM ",
          phone: "(11) 99999-9999",
          password: "123456",
          role: "PROFESSIONAL",
          companyId: " c-1 ",
          displayName: " Ana Cabeleireira ",
        }),
      ).toEqual({
        name: "Ana",
        email: "ana@email.com",
        phone: "+11999999999",
        password: "123456",
        role: "PROFESSIONAL",
        companyId: "c-1",
        displayName: "Ana Cabeleireira",
      });
    });

    it("supports nullable phone and default role", () => {
      expect(
        validateCreateUserBody({
          name: "Ana",
          email: "ana@email.com",
          phone: null,
          password: "123456",
        }),
      ).toEqual({
        name: "Ana",
        email: "ana@email.com",
        phone: null,
        password: "123456",
        role: "CLIENT",
      });
    });

    it("rejects invalid create user body variants", () => {
      expect(() => validateCreateUserBody({})).toThrow();
      expect(() =>
        validateCreateUserBody({
          name: "Ana",
          email: "ana@email.com",
          password: "123",
        }),
      ).toThrow();
      expect(() =>
        validateCreateUserBody({
          name: "Ana",
          email: "ana@email.com",
          password: "123456",
          role: "INVALID",
        }),
      ).toThrow();
      expect(() =>
        validateCreateUserBody({
          name: "Ana",
          email: "ana@email.com",
          password: "123456",
          role: "PROFESSIONAL",
        }),
      ).toThrow();
    });

    it("validates update user body", () => {
      expect(
        validateUpdateUserBody({
          name: " Ana ",
          email: " ANA@EMAIL.COM ",
          phone: "+55 11 99999-9999",
          password: "123456",
          role: "CLIENT",
          companyId: " c-1 ",
          displayName: " Ana ",
        }),
      ).toEqual({
        name: "Ana",
        email: "ana@email.com",
        phone: "+5511999999999",
        password: "123456",
        role: "CLIENT",
        companyId: "c-1",
        displayName: "Ana",
      });
      expect(validateUpdateUserBody({ phone: null })).toEqual({ phone: null });
      expect(() => validateUpdateUserBody({})).toThrow();
    });

    it("validates search users query", () => {
      expect(validateSearchUsersQuery("  ana  ")).toBe("ana");
      expect(() => validateSearchUsersQuery("  ")).toThrow();
    });
  });

  describe("company.validator", () => {
    it("validates create and update company bodies", () => {
      expect(
        validateCreateCompanyBody({
          name: " Empresa ",
          slug: " EMPRESA-X ",
          ownerId: " owner-1 ",
          timezone: " America/Sao_Paulo ",
        }),
      ).toEqual({
        name: "Empresa",
        slug: "empresa-x",
        ownerId: "owner-1",
        timezone: "America/Sao_Paulo",
      });

      expect(
        validateUpdateCompanyBody({
          name: " Novo ",
          slug: " NOVO ",
          ownerId: " owner-2 ",
          timezone: " UTC ",
        }),
      ).toEqual({
        name: "Novo",
        slug: "novo",
        ownerId: "owner-2",
        timezone: "UTC",
      });

      expect(() => validateUpdateCompanyBody({})).toThrow();
      expect(() => validateCreateCompanyBody({ name: "" })).toThrow();
    });
  });

  describe("service.validator", () => {
    it("validates create and update service bodies", () => {
      expect(
        validateCreateServiceBody({
          companyId: " c-1 ",
          name: " Corte ",
          description: "  Masculino  ",
          duration: 45,
        }),
      ).toEqual({
        companyId: "c-1",
        name: "Corte",
        description: "Masculino",
        duration: 45,
      });

      expect(
        validateUpdateServiceBody({
          companyId: " c-1 ",
          name: " Corte ",
          description: "   ",
          duration: 30,
        }),
      ).toEqual({
        companyId: "c-1",
        name: "Corte",
        description: null,
        duration: 30,
      });

      expect(validateUpdateServiceBody({ description: null })).toEqual({
        description: null,
      });

      expect(() => validateCreateServiceBody({})).toThrow();
      expect(() => validateUpdateServiceBody({ duration: 0 })).toThrow();
      expect(() => validateUpdateServiceBody({ description: 123 })).toThrow();
    });
  });

  describe("availability.validator", () => {
    it("validates create and update availability bodies", () => {
      expect(
        validateCreateAvailabilityBody({
          professionalId: " p-1 ",
          weekday: 1,
          startTime: " 09:00 ",
          endTime: " 17:00 ",
          isActive: true,
        }),
      ).toEqual({
        professionalId: "p-1",
        weekday: 1,
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      });

      expect(
        validateUpdateAvailabilityBody({
          weekday: 2,
          startTime: " 10:00 ",
          endTime: " 18:00 ",
          isActive: false,
        }),
      ).toEqual({
        weekday: 2,
        startTime: "10:00",
        endTime: "18:00",
        isActive: false,
      });

      expect(() => validateUpdateAvailabilityBody({})).toThrow();
      expect(() =>
        validateCreateAvailabilityBody({ professionalId: "p-1", weekday: 1 }),
      ).toThrow();
    });
  });

  describe("professional-service.validator", () => {
    it("validates create and update professional service bodies", () => {
      expect(
        validateCreateProfessionalServiceBody({
          professionalId: " p-1 ",
          serviceId: " s-1 ",
          price: 120,
          isActive: true,
        }),
      ).toEqual({
        professionalId: "p-1",
        serviceId: "s-1",
        price: 120,
        isActive: true,
      });

      expect(
        validateUpdateProfessionalServiceBody({
          professionalId: " p-2 ",
          serviceId: " s-2 ",
          price: 90,
          isActive: false,
        }),
      ).toEqual({
        professionalId: "p-2",
        serviceId: "s-2",
        price: 90,
        isActive: false,
      });

      expect(() => validateUpdateProfessionalServiceBody({})).toThrow();
      expect(() =>
        validateCreateProfessionalServiceBody({
          professionalId: "p-1",
          serviceId: "s-1",
          price: 0,
        }),
      ).toThrow();
    });
  });

  describe("appointment.validator", () => {
    it("validates create and update appointment bodies", () => {
      expect(
        validateCreateAppointmentBody({
          companyId: " c-1 ",
          clientId: " u-1 ",
          professionalId: " p-1 ",
          serviceId: " s-1 ",
          date: " 2026-04-10 ",
          startTime: " 09:00 ",
          endTime: " 10:00 ",
        }),
      ).toEqual({
        companyId: "c-1",
        clientId: "u-1",
        professionalId: "p-1",
        serviceId: "s-1",
        date: "2026-04-10",
        startTime: "09:00",
        endTime: "10:00",
      });

      expect(validateUpdateAppointmentBody({ status: " CONFIRMED " })).toEqual({
        status: "CONFIRMED",
      });

      expect(() => validateCreateAppointmentBody({})).toThrow();
      expect(() => validateUpdateAppointmentBody({})).toThrow();
    });
  });

  describe("schedule-exception.validator", () => {
    it("validates create schedule exception and trims description", () => {
      expect(
        validateCreateScheduleExceptionBody({
          type: "BLOCK",
          startDate: "2026-04-10T10:00:00.000Z",
          endDate: "2026-04-10T11:00:00.000Z",
          title: "  Almoço  ",
          description: "  Pausa  ",
        }),
      ).toEqual({
        type: "BLOCK",
        startDate: "2026-04-10T10:00:00.000Z",
        endDate: "2026-04-10T11:00:00.000Z",
        title: "Almoço",
        description: "Pausa",
      });
      expect(() =>
        validateCreateScheduleExceptionBody({ type: "INVALID" }),
      ).toThrow();
    });

    it("validates update schedule exception body", () => {
      expect(
        validateUpdateScheduleExceptionBody({
          type: "BREAK",
          startDate: "2026-04-10T12:00:00.000Z",
          endDate: "2026-04-10T13:00:00.000Z",
          title: "  Pausa  ",
          description: "   ",
        }),
      ).toEqual({
        type: "BREAK",
        startDate: "2026-04-10T12:00:00.000Z",
        endDate: "2026-04-10T13:00:00.000Z",
        title: "Pausa",
        description: null,
      });

      expect(() => validateUpdateScheduleExceptionBody({})).toThrow();
      expect(() =>
        validateUpdateScheduleExceptionBody({
          startDate: "2026-04-10T13:00:00.000Z",
          endDate: "2026-04-10T12:00:00.000Z",
        }),
      ).toThrow();
    });

    it("validates get slots params", () => {
      expect(
        validateGetSlotsParams({
          professionalId: "p-1",
          serviceId: "s-1",
          date: "2026-04-10T12:00:00.000Z",
        }),
      ).toEqual({
        professionalId: "p-1",
        serviceId: "s-1",
        date: "2026-04-10",
      });

      expect(() => validateGetSlotsParams({ professionalId: "p-1" })).toThrow();
      expect(() =>
        validateGetSlotsParams({
          professionalId: "p-1",
          serviceId: "s-1",
          date: "not-a-date",
        }),
      ).toThrow();
    });
  });
});
