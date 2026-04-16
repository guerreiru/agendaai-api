import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../../src/app';
import * as appointmentService from '../../src/services/appointment.service';
import * as authService from '../../src/services/auth.service';
import * as availabilityService from '../../src/services/availability.service';
import * as companyService from '../../src/services/company.service';
import * as professionalServiceService from '../../src/services/professional-service.service';
import * as serviceService from '../../src/services/service.service';
import * as userService from '../../src/services/user.service';
import { AppError } from '../../src/utils/app-error';

vi.mock("../../src/services/auth.service");
vi.mock("../../src/services/user.service");
vi.mock("../../src/services/company.service");
vi.mock("../../src/services/service.service");
vi.mock("../../src/services/professional-service.service");
vi.mock("../../src/services/availability.service");
vi.mock("../../src/services/appointment.service");

describe("HTTP integration - routes/controllers", () => {
  const adminToken = "test-admin-token";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.verifyAccessToken).mockReturnValue({
      userId: "admin-1",
      email: "admin@email.com",
      role: "ADMIN",
    } as never);
  });

  describe("users", () => {
    it("POST /users returns 201", async () => {
      vi.mocked(userService.signUpUser).mockResolvedValue({
        id: "u-1",
        name: "Maria",
      } as never);

      const response = await request(app).post("/users").send({
        name: "Maria",
        email: "maria@email.com",
        password: "123456",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: "u-1", name: "Maria" });
    });

    it("GET /users returns 200", async () => {
      vi.mocked(userService.listUsers).mockResolvedValue([
        { id: "u-1" },
      ] as never);

      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("GET /users/:id returns 200", async () => {
      vi.mocked(userService.getUser).mockResolvedValue({ id: "u-1" } as never);

      const response = await request(app)
        .get("/users/u-1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("u-1");
    });

    it("PATCH /users/:id returns 200", async () => {
      vi.mocked(userService.updateUserAccount).mockResolvedValue({
        id: "u-1",
        name: "Novo",
      } as never);

      const response = await request(app)
        .patch("/users/u-1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Novo" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Novo");
    });

    it("DELETE /users/:id returns 200", async () => {
      vi.mocked(userService.deleteUserAccount).mockResolvedValue({
        id: "u-1",
      } as never);

      const response = await request(app)
        .delete("/users/u-1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("u-1");
    });
  });

  describe("companies", () => {
    it("POST /companies returns 201", async () => {
      vi.mocked(companyService.createCompanyAccount).mockResolvedValue({
        id: "c-1",
      } as never);

      const response = await request(app)
        .post("/companies")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Empresa X",
          slug: "empresa-x",
          ownerId: "owner-1",
          timezone: "America/Sao_Paulo",
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe("c-1");
    });

    it("GET /companies returns 200", async () => {
      vi.mocked(companyService.listCompanies).mockResolvedValue([
        { id: "c-1" },
      ] as never);

      const response = await request(app).get("/companies");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("GET /companies/:id returns 200", async () => {
      vi.mocked(companyService.getCompany).mockResolvedValue({
        id: "c-1",
      } as never);

      const response = await request(app).get("/companies/c-1");

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("c-1");
    });

    it("GET /agendaai/:slug returns 200", async () => {
      vi.mocked(companyService.getPublicCompanyBySlug).mockResolvedValue({
        id: "c-1",
        slug: "empresa-x",
        services: [],
        professionals: [],
      } as never);

      const response = await request(app).get("/agendaai/empresa-x");

      expect(response.status).toBe(200);
      expect(response.body.slug).toBe("empresa-x");
    });

    it("PATCH /companies/:id returns 200", async () => {
      vi.mocked(companyService.updateCompanyAccount).mockResolvedValue({
        id: "c-1",
        name: "Empresa Y",
      } as never);

      const response = await request(app)
        .patch("/companies/c-1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Empresa Y" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Empresa Y");
    });

    it("DELETE /companies/:id returns 200", async () => {
      vi.mocked(companyService.deleteCompanyAccount).mockResolvedValue({
        id: "c-1",
      } as never);

      const response = await request(app)
        .delete("/companies/c-1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("c-1");
    });
  });

  describe("services", () => {
    it("POST /services returns 201", async () => {
      vi.mocked(serviceService.createCatalogService).mockResolvedValue({
        id: "s-1",
      } as never);

      const response = await request(app)
        .post("/services")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          companyId: "c-1",
          name: "Corte",
          duration: 30,
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe("s-1");
    });

    it("GET /services returns 200", async () => {
      vi.mocked(serviceService.listCatalogServices).mockResolvedValue([
        { id: "s-1" },
      ] as never);

      const response = await request(app)
        .get("/services")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("GET /services/:id returns 200", async () => {
      vi.mocked(serviceService.getCatalogService).mockResolvedValue({
        id: "s-1",
      } as never);

      const response = await request(app).get("/services/s-1");

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("s-1");
    });

    it("PATCH /services/:id returns 200", async () => {
      vi.mocked(serviceService.updateCatalogService).mockResolvedValue({
        id: "s-1",
        name: "Barba",
      } as never);

      const response = await request(app)
        .patch("/services/s-1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Barba" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Barba");
    });

    it("DELETE /services/:id returns 200", async () => {
      vi.mocked(serviceService.deleteCatalogService).mockResolvedValue({
        id: "s-1",
      } as never);

      const response = await request(app)
        .delete("/services/s-1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("s-1");
    });
  });

  describe("professional-services", () => {
    it("POST /professional-services returns 201", async () => {
      vi.mocked(
        professionalServiceService.createProfessionalServiceOffer,
      ).mockResolvedValue({ id: "ps-1" } as never);

      const response = await request(app)
        .post("/professional-services")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          professionalId: "p-1",
          serviceId: "s-1",
          price: 49.9,
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe("ps-1");
    });

    it("GET /professional-services returns 200", async () => {
      vi.mocked(
        professionalServiceService.listProfessionalServiceOffers,
      ).mockResolvedValue([{ id: "ps-1" }] as never);

      const response = await request(app)
        .get("/professional-services")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("GET /professional-services/:id returns 200", async () => {
      vi.mocked(
        professionalServiceService.getProfessionalServiceOffer,
      ).mockResolvedValue({ id: "ps-1" } as never);

      const response = await request(app).get("/professional-services/ps-1");

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("ps-1");
    });

    it("PATCH /professional-services/:id returns 200", async () => {
      vi.mocked(
        professionalServiceService.updateProfessionalServiceOffer,
      ).mockResolvedValue({
        id: "ps-1",
        price: 59.9,
      } as never);

      const response = await request(app)
        .patch("/professional-services/ps-1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ price: 59.9 });

      expect(response.status).toBe(200);
      expect(response.body.price).toBe(59.9);
    });

    it("DELETE /professional-services/:id returns 200", async () => {
      vi.mocked(
        professionalServiceService.deleteProfessionalServiceOffer,
      ).mockResolvedValue({
        id: "ps-1",
      } as never);

      const response = await request(app)
        .delete("/professional-services/ps-1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("ps-1");
    });
  });

  describe("availabilities", () => {
    it("POST /availabilities/batch returns 201", async () => {
      vi.mocked(
        availabilityService.createProfessionalAvailabilitiesBulk,
      ).mockResolvedValue([
        { id: "a-1" },
        { id: "a-2" },
      ] as never);

      const response = await request(app)
        .post("/availabilities/batch")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          professionalId: "p-1",
          slots: [
            { weekday: 1, startTime: "08:00", endTime: "12:00" },
            { weekday: 2, startTime: "13:00", endTime: "18:00" },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveLength(2);
    });

    it("POST /availabilities returns 201", async () => {
      vi.mocked(
        availabilityService.createProfessionalAvailability,
      ).mockResolvedValue({
        id: "a-1",
      } as never);

      const response = await request(app)
        .post("/availabilities")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          professionalId: "p-1",
          weekday: 1,
          startTime: "08:00",
          endTime: "18:00",
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe("a-1");
    });

    it("GET /availabilities returns 200", async () => {
      vi.mocked(availabilityService.listAllAvailabilities).mockResolvedValue([
        { id: "a-1" },
      ] as never);

      const response = await request(app)
        .get("/availabilities")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("GET /professionals/:professionalId/availabilities returns 200", async () => {
      vi.mocked(
        availabilityService.listProfessionalAvailabilities,
      ).mockResolvedValue([{ id: "a-1" }] as never);

      const response = await request(app).get(
        "/professionals/p-1/availabilities",
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("GET /availabilities/:id returns 200", async () => {
      vi.mocked(availabilityService.getAvailability).mockResolvedValue({
        id: "a-1",
      } as never);

      const response = await request(app)
        .get("/availabilities/a-1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("a-1");
    });

    it("PATCH /availabilities/:id returns 200", async () => {
      vi.mocked(
        availabilityService.updateProfessionalAvailability,
      ).mockResolvedValue({
        id: "a-1",
        startTime: "09:00",
      } as never);

      const response = await request(app)
        .patch("/availabilities/a-1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ startTime: "09:00" });

      expect(response.status).toBe(200);
      expect(response.body.startTime).toBe("09:00");
    });

    it("DELETE /availabilities/:id returns 200", async () => {
      vi.mocked(
        availabilityService.deleteProfessionalAvailabilityWithContext,
      ).mockResolvedValue({
        id: "a-1",
      } as never);

      const response = await request(app)
        .delete("/availabilities/a-1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("a-1");
    });
  });

  describe("appointments", () => {
    it("POST /appointments returns 201", async () => {
      vi.mocked(appointmentService.createClientAppointment).mockResolvedValue({
        id: "apt-1",
      } as never);

      const response = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          companyId: "c-1",
          clientId: "client-1",
          professionalId: "prof-1",
          serviceId: "s-1",
          date: "2026-04-15",
          startTime: "10:00",
          endTime: "11:00",
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe("apt-1");
    });

    it("GET /appointments returns 200", async () => {
      vi.mocked(appointmentService.listAppointments).mockResolvedValue([
        { id: "apt-1" },
      ] as never);

      const response = await request(app)
        .get("/appointments")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("GET /appointments/:id returns 200", async () => {
      vi.mocked(appointmentService.getAppointment).mockResolvedValue({
        id: "apt-1",
      } as never);

      const response = await request(app)
        .get("/appointments/apt-1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("apt-1");
    });

    it("PATCH /appointments/:id returns 200", async () => {
      vi.mocked(appointmentService.updateAppointmentStatus).mockResolvedValue({
        id: "apt-1",
        status: "CONFIRMED",
      } as never);

      const response = await request(app)
        .patch("/appointments/apt-1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "CONFIRMED" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("CONFIRMED");
    });

    it("DELETE /appointments/:id returns 200", async () => {
      vi.mocked(
        appointmentService.deleteClientAppointmentWithContext,
      ).mockResolvedValue({ id: "apt-1" } as never);

      const response = await request(app)
        .delete("/appointments/apt-1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("apt-1");
    });
  });

  it("returns 400 for invalid payload validation", async () => {
    const response = await request(app).post("/users").send({
      name: "",
      email: "invalido",
      password: "123",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("The name is required.");
  });

  it("maps AppError from service", async () => {
    vi.mocked(userService.getUser).mockRejectedValue(
      new AppError("User not found.", 404),
    );

    const response = await request(app)
      .get("/users/u-missing")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("User not found.");
  });

  it("returns 404 for unknown route", async () => {
    const response = await request(app).get("/rota-nao-existe");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Route not found.");
  });
});
