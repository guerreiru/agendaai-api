import { AppError } from "../utils/app-error";
import { isString } from "../utils/isString";
import type { CreateCompanyBody, UpdateCompanyBody } from "../types/company";

export function validateCreateCompanyBody(body: unknown): CreateCompanyBody {
  if (typeof body !== "object" || body === null) {
    throw new AppError("Invalid request body.", 400);
  }

  const { name, slug, ownerId, timezone, phone } = body as Record<
    string,
    unknown
  >;

  if (!isString(name) || !name.trim()) {
    throw new AppError("The company name is required.", 400);
  }

  if (!isString(slug) || !slug.trim()) {
    throw new AppError("The company slug is required.", 400);
  }

  if (!isString(ownerId) || !ownerId.trim()) {
    throw new AppError("The ownerId is required.", 400);
  }

  if (!isString(timezone) || !timezone.trim()) {
    throw new AppError("The timezone is required.", 400);
  }

  if (phone !== undefined && phone !== null && !isString(phone)) {
    throw new AppError("The phone must be a string or null.", 400);
  }

  return {
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    ownerId: ownerId.trim(),
    timezone: timezone.trim(),
    phone: phone?.trim() ?? null,
  };
}

export function validateUpdateCompanyBody(body: unknown): UpdateCompanyBody {
  if (typeof body !== "object" || body === null) {
    throw new AppError("Invalid request body.", 400);
  }

  const { name, slug, ownerId, timezone, phone } = body as Record<
    string,
    unknown
  >;
  const data: UpdateCompanyBody = {};

  if (name !== undefined) {
    if (!isString(name) || !name.trim()) {
      throw new AppError("The company name cannot be empty.", 400);
    }
    data.name = name.trim();
  }

  if (slug !== undefined) {
    if (!isString(slug) || !slug.trim()) {
      throw new AppError("The company slug cannot be empty.", 400);
    }
    data.slug = slug.trim().toLowerCase();
  }

  if (ownerId !== undefined) {
    if (!isString(ownerId) || !ownerId.trim()) {
      throw new AppError("The ownerId cannot be empty.", 400);
    }
    data.ownerId = ownerId.trim();
  }

  if (timezone !== undefined) {
    if (!isString(timezone) || !timezone.trim()) {
      throw new AppError("The timezone cannot be empty.", 400);
    }
    data.timezone = timezone.trim();
  }

  if (phone !== undefined) {
    if (phone !== null && !isString(phone)) {
      throw new AppError("The phone must be a string or null.", 400);
    }
    data.phone = phone?.trim() ?? null;
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("At least one field must be provided to update.", 400);
  }

  return data;
}
