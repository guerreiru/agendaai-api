import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../src/utils/app-error";
import {
  createCatalogService,
  deleteCatalogService,
  getCatalogService,
  listCatalogServices,
  listCatalogServicesByCompany,
  updateCatalogService,
} from "../../src/services/service.service";
import * as serviceRepository from "../../src/repositories/service.repository";
import * as companyRepository from "../../src/repositories/company.repository";

vi.mock("../../src/repositories/service.repository");
vi.mock("../../src/repositories/company.repository");

describe("service.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a service", async () => {
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
      ownerId: "owner-1",
    } as never);
    vi.mocked(serviceRepository.createService).mockResolvedValue({
      id: "s-1",
    } as never);

    const service = await createCatalogService(
      {
        companyId: "c-1",
        name: "Corte",
        description: "Corte masculino",
        duration: 30,
      },
      {
        actorId: "owner-1",
        actorRole: "COMPANY_OWNER",
      },
    );

    expect(service.id).toBe("s-1");
  });

  it("rejects service with invalid duration", async () => {
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
      ownerId: "owner-1",
    } as never);

    await expect(
      createCatalogService(
        {
          companyId: "c-1",
          name: "Corte",
          duration: 0,
        },
        {
          actorId: "owner-1",
          actorRole: "COMPANY_OWNER",
        },
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("lists services for admin", async () => {
    vi.mocked(serviceRepository.findServices).mockResolvedValue([
      { id: "s-1" },
    ] as never);

    const services = await listCatalogServices({
      actorId: "admin-1",
      actorRole: "ADMIN",
    });

    expect(services).toHaveLength(1);
  });

  it("lists services by company", async () => {
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
      ownerId: "owner-1",
    } as never);
    vi.mocked(serviceRepository.findServicesByCompany).mockResolvedValue([
      { id: "s-1" },
    ] as never);

    const services = await listCatalogServicesByCompany("c-1");

    expect(services).toHaveLength(1);
  });

  it("gets one service", async () => {
    vi.mocked(serviceRepository.findServiceById).mockResolvedValue({
      id: "s-1",
    } as never);

    const service = await getCatalogService("s-1");

    expect(service.id).toBe("s-1");
  });

  it("updates a service", async () => {
    vi.mocked(serviceRepository.findServiceById).mockResolvedValue({
      id: "s-1",
      companyId: "c-1",
    } as never);
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
      ownerId: "owner-1",
    } as never);
    vi.mocked(serviceRepository.updateService).mockResolvedValue({
      id: "s-1",
      name: "Barba",
    } as never);

    const service = await updateCatalogService(
      "s-1",
      { name: "Barba" },
      {
        actorId: "owner-1",
        actorRole: "COMPANY_OWNER",
      },
    );

    expect(service.name).toBe("Barba");
  });

  it("deletes a service", async () => {
    vi.mocked(serviceRepository.findServiceById).mockResolvedValue({
      id: "s-1",
      companyId: "c-1",
    } as never);
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
      ownerId: "owner-1",
    } as never);
    vi.mocked(serviceRepository.deleteService).mockResolvedValue({
      id: "s-1",
    } as never);

    const deleted = await deleteCatalogService("s-1", {
      actorId: "owner-1",
      actorRole: "COMPANY_OWNER",
    });

    expect(deleted.id).toBe("s-1");
  });
});
