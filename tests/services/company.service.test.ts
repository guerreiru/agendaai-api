import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../src/utils/app-error";
import {
  createCompanyAccount,
  deleteCompanyAccount,
  getCompany,
  listCompanies,
  updateCompanyAccount,
} from "../../src/services/company.service";
import * as companyRepository from "../../src/repositories/company.repository";
import * as userRepository from "../../src/repositories/user.repository";

vi.mock("../../src/repositories/company.repository");
vi.mock("../../src/repositories/user.repository");

describe("company.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a company", async () => {
    vi.mocked(companyRepository.findCompanyBySlug).mockResolvedValue(null);
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "owner-1",
      role: "COMPANY_OWNER",
    } as never);
    vi.mocked(companyRepository.createCompany).mockResolvedValue({
      id: "c-1",
    } as never);

    const result = await createCompanyAccount(
      {
        name: "Barbearia X",
        slug: "barbearia-x",
        ownerId: "owner-1",
        timezone: "America/Sao_Paulo",
      },
      {
        actorId: "owner-1",
        actorRole: "COMPANY_OWNER",
      },
    );

    expect(result.id).toBe("c-1");
  });

  it("rejects company create with invalid owner role", async () => {
    vi.mocked(companyRepository.findCompanyBySlug).mockResolvedValue(null);
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "user-1",
      role: "CLIENT",
    } as never);

    await expect(
      createCompanyAccount(
        {
          name: "Barbearia X",
          slug: "barbearia-x",
          ownerId: "user-1",
          timezone: "America/Sao_Paulo",
        },
        {
          actorId: "user-1",
          actorRole: "COMPANY_OWNER",
        },
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("lists companies", async () => {
    vi.mocked(companyRepository.findCompanies).mockResolvedValue([
      { id: "c-1" },
    ] as never);

    const companies = await listCompanies();

    expect(companies).toHaveLength(1);
  });

  it("gets a company by id", async () => {
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
    } as never);

    const company = await getCompany("c-1");

    expect(company.id).toBe("c-1");
  });

  it("updates a company", async () => {
    vi.mocked(companyRepository.findCompanyById).mockResolvedValueOnce({
      id: "c-1",
      ownerId: "owner-1",
    } as never);
    vi.mocked(companyRepository.updateCompany).mockResolvedValue({
      id: "c-1",
      name: "Novo",
    } as never);

    const company = await updateCompanyAccount(
      "c-1",
      { name: "Novo" },
      {
        actorId: "owner-1",
        actorRole: "COMPANY_OWNER",
      },
    );

    expect(company.name).toBe("Novo");
  });

  it("deletes a company", async () => {
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
      ownerId: "owner-1",
    } as never);
    vi.mocked(companyRepository.deleteCompany).mockResolvedValue({
      id: "c-1",
    } as never);

    const deleted = await deleteCompanyAccount("c-1", {
      actorId: "owner-1",
      actorRole: "COMPANY_OWNER",
    });

    expect(deleted.id).toBe("c-1");
  });
});
