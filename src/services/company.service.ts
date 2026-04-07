import {
  createCompany,
  deleteCompany,
  findCompanies,
  findCompanyById,
  findCompanyPublicProfileBySlug,
  findCompanyBySlug,
  findPublicCompaniesBySearch,
  updateCompany,
} from "../repositories/company.repository";
import { findProfessionalServicesByCompany } from "../repositories/professional-service.repository";
import { findUserById } from "../repositories/user.repository";
import type { CreateCompanyInput, UpdateCompanyInput } from "../types/company";
import type { UserRole } from "../types/user";
import { AppError } from "../utils/app-error";
import { isString } from "../utils/isString";

export type CompanyActorContext = {
  actorId: string;
  actorRole: UserRole;
};

function canManageCompany(role: UserRole): boolean {
  return role === "COMPANY_OWNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

function assertCanManageCompany(context: CompanyActorContext) {
  if (!canManageCompany(context.actorRole)) {
    throw new AppError("Insufficient permissions.", 403);
  }
}

export async function createCompanyAccount(
  input: CreateCompanyInput,
  context: CompanyActorContext,
) {
  assertCanManageCompany(context);

  if (
    context.actorRole === "COMPANY_OWNER" &&
    context.actorId !== input.ownerId
  ) {
    throw new AppError(
      "Company owner can only create a company for themselves.",
      403,
    );
  }

  const slug = input.slug.trim().toLowerCase();

  const existingCompany = await findCompanyBySlug(slug);
  if (existingCompany) {
    throw new AppError("Company slug already registered.", 409);
  }

  const owner = await findUserById(input.ownerId);
  if (!owner) {
    throw new AppError("Owner user not found.", 404);
  }

  if (owner.role !== "COMPANY_OWNER") {
    throw new AppError("Owner user must have role COMPANY_OWNER.", 400);
  }

  return createCompany({
    name: input.name.trim(),
    slug,
    ownerId: input.ownerId,
    timezone: input.timezone.trim(),
    phone: input.phone?.trim() ?? null,
  });
}

export async function listCompanies() {
  return findCompanies();
}

export async function getCompany(id: string) {
  const company = await findCompanyById(id);
  if (!company) {
    throw new AppError("Company not found.", 404);
  }

  return company;
}

export async function searchPublicCompanies(q?: string) {
  return findPublicCompaniesBySearch(q);
}

export async function getPublicCompanyBySlug(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) {
    throw new AppError("Company slug is required.", 400);
  }

  const company = await findCompanyPublicProfileBySlug(normalizedSlug);
  if (!company) {
    throw new AppError("Company not found.", 404);
  }

  const activeOffers = await findProfessionalServicesByCompany(
    company.id,
    undefined,
    false,
  );

  const offersByProfessional = new Map<
    string,
    Array<{
      id: string;
      serviceId: string;
      price: number;
      isActive: boolean;
    }>
  >();

  for (const offer of activeOffers) {
    const offers = offersByProfessional.get(offer.professionalId) ?? [];
    offers.push({
      id: offer.id,
      serviceId: offer.serviceId,
      price: offer.price,
      isActive: offer.isActive,
    });
    offersByProfessional.set(offer.professionalId, offers);
  }

  const professionals = company.professionals
    .map(
      (professional: {
        id: string;
        name: string;
        displayName: string | null;
      }) => ({
        id: professional.id,
        name: professional.name,
        displayName: professional.displayName,
        offeredServices: offersByProfessional.get(professional.id) ?? [],
      }),
    )
    .filter(
      (professional: {
        id: string;
        name: string;
        displayName: string | null;
        offeredServices: Array<{
          id: string;
          serviceId: string;
          price: number;
          isActive: boolean;
        }>;
      }) => professional.offeredServices.length > 0,
    );

  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    timezone: company.timezone,
    services: company.services,
    professionals,
  };
}

export async function updateCompanyAccount(
  id: string,
  input: UpdateCompanyInput,
  context: CompanyActorContext,
) {
  assertCanManageCompany(context);

  const existingCompany = await findCompanyById(id);
  if (!existingCompany) {
    throw new AppError("Company not found.", 404);
  }

  if (
    context.actorRole === "COMPANY_OWNER" &&
    existingCompany.ownerId !== context.actorId
  ) {
    throw new AppError("Insufficient permissions for this company.", 403);
  }

  const data: UpdateCompanyInput = {};

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      throw new AppError("The company name cannot be empty.", 400);
    }
    data.name = input.name.trim();
  }

  if (input.slug !== undefined) {
    const normalizedSlug = input.slug.trim().toLowerCase();
    if (!normalizedSlug) {
      throw new AppError("The company slug cannot be empty.", 400);
    }

    const companyBySlug = await findCompanyBySlug(normalizedSlug);
    if (companyBySlug && companyBySlug.id !== existingCompany.id) {
      throw new AppError("Company slug already registered.", 409);
    }

    data.slug = normalizedSlug;
  }

  if (input.ownerId !== undefined) {
    const owner = await findUserById(input.ownerId);
    if (!owner) {
      throw new AppError("Owner user not found.", 404);
    }

    if (owner.role !== "COMPANY_OWNER") {
      throw new AppError("Owner user must have role COMPANY_OWNER.", 400);
    }

    data.ownerId = input.ownerId;
  }

  if (input.timezone !== undefined) {
    if (!input.timezone.trim()) {
      throw new AppError("The timezone cannot be empty.", 400);
    }
    data.timezone = input.timezone.trim();
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("At least one field must be provided to update.", 400);
  }

  if (input.phone !== undefined) {
    if (input.phone !== null && !isString(input.phone)) {
      throw new AppError("The phone must be a string or null.", 400);
    }
    data.phone = input.phone?.trim() ?? null;
  }

  return updateCompany(id, data);
}

export async function deleteCompanyAccount(
  id: string,
  context: CompanyActorContext,
) {
  assertCanManageCompany(context);

  const existingCompany = await findCompanyById(id);
  if (!existingCompany) {
    throw new AppError("Company not found.", 404);
  }

  if (
    context.actorRole === "COMPANY_OWNER" &&
    existingCompany.ownerId !== context.actorId
  ) {
    throw new AppError("Insufficient permissions for this company.", 403);
  }

  return deleteCompany(id);
}
