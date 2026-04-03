import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../src/utils/app-error";
import {
  createClientAppointment,
  deleteClientAppointment,
  getAppointment,
  listAppointments,
  updateAppointmentStatus,
} from "../../src/services/appointment.service";
import * as appointmentRepository from "../../src/repositories/appointment.repository";
import * as userRepository from "../../src/repositories/user.repository";
import * as serviceRepository from "../../src/repositories/service.repository";
import * as companyRepository from "../../src/repositories/company.repository";
import * as professionalServiceRepository from "../../src/repositories/professional-service.repository";
import * as availabilityRepository from "../../src/repositories/availability.repository";
import { prisma } from "../../src/lib/prisma";

vi.mock("../../src/repositories/appointment.repository");
vi.mock("../../src/repositories/user.repository");
vi.mock("../../src/repositories/service.repository");
vi.mock("../../src/repositories/company.repository");
vi.mock("../../src/repositories/professional-service.repository");
vi.mock("../../src/repositories/availability.repository");
vi.mock("../../src/lib/prisma", () => ({
  prisma: {
    scheduleException: {
      findMany: vi.fn(),
    },
  },
}));

describe("appointment.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates appointment for client", async () => {
    vi.mocked(userRepository.findUserById)
      .mockResolvedValueOnce({ id: "client-1", role: "CLIENT" } as never)
      .mockResolvedValueOnce({
        id: "prof-1",
        role: "PROFESSIONAL",
        companyId: "c-1",
      } as never);
    vi.mocked(serviceRepository.findServiceById).mockResolvedValue({
      id: "s-1",
      companyId: "c-1",
      duration: 60,
    } as never);
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
      timezone: "UTC",
    } as never);
    vi.mocked(
      professionalServiceRepository.findProfessionalServiceByProfessionalAndService,
    ).mockResolvedValue({ id: "ps-1", price: 100, isActive: true } as never);
    vi.mocked(
      availabilityRepository.findAvailabilitiesByProfessionalAndWeekday,
    ).mockResolvedValue([
      { id: "a-1", startTime: "08:00", endTime: "18:00", isActive: true },
    ] as never);
    vi.mocked(prisma.scheduleException.findMany).mockResolvedValue([] as never);
    vi.mocked(
      appointmentRepository.findConflictingAppointments,
    ).mockResolvedValue([]);
    vi.mocked(appointmentRepository.createAppointment).mockResolvedValue({
      id: "apt-1",
    } as never);

    const inputDate = new Date("2026-04-06");

    const result = await createClientAppointment({
      companyId: "c-1",
      clientId: "client-1",
      professionalId: "prof-1",
      serviceId: "s-1",
      date: inputDate,
      startTime: "10:00",
      endTime: "11:00",
    });

    expect(result.id).toBe("apt-1");
    expect(appointmentRepository.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        date: new Date("2026-04-06T00:00:00.000Z"),
      }),
    );
  });

  it("rejects appointment with conflict", async () => {
    vi.mocked(userRepository.findUserById)
      .mockResolvedValueOnce({ id: "client-1", role: "CLIENT" } as never)
      .mockResolvedValueOnce({
        id: "prof-1",
        role: "PROFESSIONAL",
        companyId: "c-1",
      } as never);
    vi.mocked(serviceRepository.findServiceById).mockResolvedValue({
      id: "s-1",
      companyId: "c-1",
      duration: 60,
    } as never);
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
      timezone: "UTC",
    } as never);
    vi.mocked(
      professionalServiceRepository.findProfessionalServiceByProfessionalAndService,
    ).mockResolvedValue({ id: "ps-1", price: 100, isActive: true } as never);
    vi.mocked(
      availabilityRepository.findAvailabilitiesByProfessionalAndWeekday,
    ).mockResolvedValue([
      { id: "a-1", startTime: "08:00", endTime: "18:00", isActive: true },
    ] as never);
    vi.mocked(prisma.scheduleException.findMany).mockResolvedValue([] as never);
    vi.mocked(
      appointmentRepository.findConflictingAppointments,
    ).mockResolvedValue([{ id: "apt-existing" }] as never);

    await expect(
      createClientAppointment({
        companyId: "c-1",
        clientId: "client-1",
        professionalId: "prof-1",
        serviceId: "s-1",
        date: new Date("2026-04-06"),
        startTime: "10:00",
        endTime: "11:00",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("keeps requested date when company timezone is negative offset", async () => {
    vi.mocked(userRepository.findUserById)
      .mockResolvedValueOnce({ id: "client-1", role: "CLIENT" } as never)
      .mockResolvedValueOnce({
        id: "prof-1",
        role: "PROFESSIONAL",
        companyId: "c-1",
      } as never);
    vi.mocked(serviceRepository.findServiceById).mockResolvedValue({
      id: "s-1",
      companyId: "c-1",
      duration: 60,
    } as never);
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
      timezone: "America/Sao_Paulo",
    } as never);
    vi.mocked(
      professionalServiceRepository.findProfessionalServiceByProfessionalAndService,
    ).mockResolvedValue({ id: "ps-1", price: 100, isActive: true } as never);
    vi.mocked(
      availabilityRepository.findAvailabilitiesByProfessionalAndWeekday,
    ).mockResolvedValue([
      { id: "a-1", startTime: "08:00", endTime: "18:00", isActive: true },
    ] as never);
    vi.mocked(prisma.scheduleException.findMany).mockResolvedValue([] as never);
    vi.mocked(
      appointmentRepository.findConflictingAppointments,
    ).mockResolvedValue([]);
    vi.mocked(appointmentRepository.createAppointment).mockResolvedValue({
      id: "apt-2",
    } as never);

    await createClientAppointment({
      companyId: "c-1",
      clientId: "client-1",
      professionalId: "prof-1",
      serviceId: "s-1",
      date: new Date("2026-04-06"),
      startTime: "10:00",
      endTime: "11:00",
    });

    expect(appointmentRepository.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        date: new Date("2026-04-06T00:00:00.000Z"),
      }),
    );
  });

  it("lists appointments", async () => {
    vi.mocked(appointmentRepository.findAppointments).mockResolvedValue([
      { id: "apt-1" },
    ] as never);

    const result = await listAppointments();

    expect(result).toHaveLength(1);
  });

  it("gets one appointment", async () => {
    vi.mocked(appointmentRepository.findAppointmentById).mockResolvedValue({
      id: "apt-1",
    } as never);

    const result = await getAppointment("apt-1");

    expect(result.id).toBe("apt-1");
  });

  it("updates appointment status", async () => {
    vi.mocked(appointmentRepository.findAppointmentById).mockResolvedValue({
      id: "apt-1",
      status: "SCHEDULED",
    } as never);
    vi.mocked(appointmentRepository.updateAppointment).mockResolvedValue({
      id: "apt-1",
      status: "CONFIRMED",
    } as never);

    const result = await updateAppointmentStatus("apt-1", {
      status: "CONFIRMED",
    });

    expect(result.status).toBe("CONFIRMED");
  });

  it("deletes appointment if not completed", async () => {
    vi.mocked(appointmentRepository.findAppointmentById).mockResolvedValue({
      id: "apt-1",
      status: "SCHEDULED",
    } as never);
    vi.mocked(appointmentRepository.deleteAppointment).mockResolvedValue({
      id: "apt-1",
    } as never);

    const result = await deleteClientAppointment("apt-1");

    expect(result.id).toBe("apt-1");
  });

  it("rejects delete of completed appointment", async () => {
    vi.mocked(appointmentRepository.findAppointmentById).mockResolvedValue({
      id: "apt-1",
      status: "COMPLETED",
    } as never);

    await expect(deleteClientAppointment("apt-1")).rejects.toBeInstanceOf(
      AppError,
    );
  });
});
