import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../src/utils/app-error";
import {
  createProfessionalServiceOffer,
  deleteProfessionalServiceOffer,
  getProfessionalServiceOffer,
  listProfessionalServiceOffers,
  listProfessionalServiceOffersByCompany,
  updateProfessionalServiceOffer,
} from "../../src/services/professional-service.service";
import * as companyRepository from "../../src/repositories/company.repository";
import * as professionalServiceRepository from "../../src/repositories/professional-service.repository";
import * as serviceRepository from "../../src/repositories/service.repository";
import * as userRepository from "../../src/repositories/user.repository";

vi.mock("../../src/repositories/professional-service.repository");
vi.mock("../../src/repositories/service.repository");
vi.mock("../../src/repositories/user.repository");
vi.mock("../../src/repositories/company.repository");

describe("professional-service.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a professional service offer", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "u-1",
      role: "PROFESSIONAL",
      companyId: "c-1",
    } as never);
    vi.mocked(serviceRepository.findServiceById).mockResolvedValue({
      id: "s-1",
      companyId: "c-1",
    } as never);
    vi.mocked(
      professionalServiceRepository.findProfessionalServiceByProfessionalAndService,
    ).mockResolvedValue(null);
    vi.mocked(
      professionalServiceRepository.createProfessionalService,
    ).mockResolvedValue({
      id: "ps-1",
    } as never);

    const result = await createProfessionalServiceOffer(
      {
        professionalId: "u-1",
        serviceId: "s-1",
        price: 49.9,
      },
      {
        actorId: "u-1",
        actorRole: "PROFESSIONAL",
      },
    );

    expect(result.id).toBe("ps-1");
  });

  it("rejects duplicate offer", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "u-1",
      role: "PROFESSIONAL",
      companyId: "c-1",
    } as never);
    vi.mocked(serviceRepository.findServiceById).mockResolvedValue({
      id: "s-1",
      companyId: "c-1",
    } as never);
    vi.mocked(
      professionalServiceRepository.findProfessionalServiceByProfessionalAndService,
    ).mockResolvedValue({ id: "ps-1" } as never);

    await expect(
      createProfessionalServiceOffer(
        {
          professionalId: "u-1",
          serviceId: "s-1",
          price: 49.9,
        },
        {
          actorId: "u-1",
          actorRole: "PROFESSIONAL",
        },
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("lists offers for admin", async () => {
    vi.mocked(
      professionalServiceRepository.findProfessionalServices,
    ).mockResolvedValue([{ id: "ps-1" }] as never);

    const offers = await listProfessionalServiceOffers({
      actorId: "admin-1",
      actorRole: "ADMIN",
    });

    expect(offers).toHaveLength(1);
  });

  it("lists active offers by company", async () => {
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
    } as never);
    vi.mocked(
      professionalServiceRepository.findProfessionalServicesByCompany,
    ).mockResolvedValue([{ id: "ps-1", isActive: true }] as never);

    const offers = await listProfessionalServiceOffersByCompany("c-1");

    expect(offers).toHaveLength(1);
  });

  it("gets one offer", async () => {
    vi.mocked(
      professionalServiceRepository.findProfessionalServiceById,
    ).mockResolvedValue({
      id: "ps-1",
    } as never);

    const offer = await getProfessionalServiceOffer("ps-1");

    expect(offer.id).toBe("ps-1");
  });

  it("updates one offer", async () => {
    vi.mocked(
      professionalServiceRepository.findProfessionalServiceById,
    ).mockResolvedValue({
      id: "ps-1",
      professionalId: "u-1",
      serviceId: "s-1",
    } as never);
    vi.mocked(
      professionalServiceRepository.updateProfessionalService,
    ).mockResolvedValue({
      id: "ps-1",
      price: 59.9,
    } as never);
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "u-1",
      role: "PROFESSIONAL",
      companyId: "c-1",
    } as never);

    const offer = await updateProfessionalServiceOffer(
      "ps-1",
      { price: 59.9 },
      {
        actorId: "u-1",
        actorRole: "PROFESSIONAL",
      },
    );

    expect(offer.price).toBe(59.9);
  });

  it("deletes one offer", async () => {
    vi.mocked(
      professionalServiceRepository.findProfessionalServiceById,
    ).mockResolvedValue({
      id: "ps-1",
      professionalId: "u-1",
    } as never);
    vi.mocked(
      professionalServiceRepository.deleteProfessionalService,
    ).mockResolvedValue({
      id: "ps-1",
    } as never);
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "u-1",
      role: "PROFESSIONAL",
      companyId: "c-1",
    } as never);

    const offer = await deleteProfessionalServiceOffer("ps-1", {
      actorId: "u-1",
      actorRole: "PROFESSIONAL",
    });

    expect(offer.id).toBe("ps-1");
  });
});
