import { AppError } from "../utils/app-error";
import { isString } from "../utils/isString";
import { normalizePhoneToE164 } from "../utils/phone";
import type { CreateUserBody, UpdateUserBody } from "../types/user";

const userRoles = [
  "CLIENT",
  "PROFESSIONAL",
  "COMPANY_OWNER",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

type UserRole = (typeof userRoles)[number];

export function validateCreateUserBody(body: unknown): CreateUserBody {
  if (typeof body !== "object" || body === null) {
    throw new AppError("Invalid request body.", 400);
  }

  const { name, email, phone, password, role, companyId, displayName } =
    body as Record<string, unknown>;

  if (!isString(name) || !name.trim()) {
    throw new AppError("The name is required.", 400);
  }

  if (!isString(email) || !email.trim()) {
    throw new AppError("The email is required.", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
    throw new AppError("The email format is invalid.", 400);
  }

  if (phone !== undefined && phone !== null) {
    if (!isString(phone) || !phone.trim()) {
      throw new AppError("The phone cannot be empty.", 400);
    }
  }

  if (!isString(password) || password.length < 6) {
    throw new AppError("The password must have at least 6 characters.", 400);
  }

  if (role !== undefined) {
    if (!isString(role) || !userRoles.includes(role as UserRole)) {
      throw new AppError("Invalid user role.", 400);
    }
  }

  if (companyId !== undefined) {
    if (!isString(companyId) || !companyId.trim()) {
      throw new AppError("The companyId cannot be empty.", 400);
    }
  }

  if (displayName !== undefined) {
    if (!isString(displayName) || !displayName.trim()) {
      throw new AppError("The displayName cannot be empty.", 400);
    }
  }

  const parsedRole = (role as UserRole | undefined) ?? "CLIENT";
  if (parsedRole === "PROFESSIONAL") {
    if (!isString(companyId) || !companyId.trim()) {
      throw new AppError("Professional user must have companyId.", 400);
    }

    if (!isString(displayName) || !displayName.trim()) {
      throw new AppError("Professional user must have displayName.", 400);
    }
  }

  const result: CreateUserBody = {
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: parsedRole,
  };

  if (phone === null) {
    result.phone = null;
  } else if (isString(phone) && phone.trim()) {
    result.phone = normalizePhoneToE164(phone);
  }

  if (isString(companyId) && companyId.trim()) {
    result.companyId = companyId.trim();
  }

  if (isString(displayName) && displayName.trim()) {
    result.displayName = displayName.trim();
  }

  return result;
}

export function validateUpdateUserBody(body: unknown): UpdateUserBody {
  if (typeof body !== "object" || body === null) {
    throw new AppError("Invalid request body.", 400);
  }

  const { name, email, phone, password, role, companyId, displayName } =
    body as Record<string, unknown>;
  const data: UpdateUserBody = {};

  if (name !== undefined) {
    if (!isString(name) || !name.trim()) {
      throw new AppError("The name cannot be empty.", 400);
    }
    data.name = name.trim();
  }

  if (email !== undefined) {
    if (!isString(email) || !email.trim()) {
      throw new AppError("The email cannot be empty.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      throw new AppError("The email format is invalid.", 400);
    }
    data.email = normalizedEmail;
  }

  if (phone !== undefined) {
    if (phone === null) {
      data.phone = null;
    } else {
      if (!isString(phone) || !phone.trim()) {
        throw new AppError("The phone cannot be empty.", 400);
      }
      data.phone = normalizePhoneToE164(phone);
    }
  }

  if (password !== undefined) {
    if (!isString(password) || password.length < 6) {
      throw new AppError("The password must have at least 6 characters.", 400);
    }
    data.password = password;
  }

  if (role !== undefined) {
    if (!isString(role) || !userRoles.includes(role as never)) {
      throw new AppError("Invalid user role.", 400);
    }
    data.role = role as UserRole;
  }

  if (companyId !== undefined) {
    if (!isString(companyId) || !companyId.trim()) {
      throw new AppError("The companyId cannot be empty.", 400);
    }
    data.companyId = companyId.trim();
  }

  if (displayName !== undefined) {
    if (!isString(displayName) || !displayName.trim()) {
      throw new AppError("The displayName cannot be empty.", 400);
    }
    data.displayName = displayName.trim();
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("At least one field must be provided to update.", 400);
  }

  return data;
}

export function validateSearchUsersQuery(query: unknown): string {
  if (!isString(query) || !query.trim()) {
    throw new AppError("Query is required.", 400);
  }

  return query.trim();
}
