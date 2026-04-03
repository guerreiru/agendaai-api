import {
  type CreateUserData,
  createUser,
  deleteUser,
  findClientUsersByEmail,
  findClientUsersByPhone,
  findUserByEmail,
  findUserById,
  findUsers,
  findUsersByCompanyId,
  updateUser,
} from "../repositories/user.repository";
import { findCompanyById } from "../repositories/company.repository";
import { AppError } from "../utils/app-error";
import type { SignUpUserInput, UpdateUserInput, UserRole } from "../types/user";
import { hashPassword } from "../utils/password";
import { normalizePhoneToE164 } from "../utils/phone";

export type UserActorContext = {
  actorId: string;
  actorRole: UserRole;
};

function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

function canSearchClients(role: UserRole): boolean {
  return (
    role === "PROFESSIONAL" ||
    role === "COMPANY_OWNER" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

export async function createUserAccount(
  input: SignUpUserInput,
  context?: UserActorContext,
) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const role = input.role ?? "CLIENT";

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    if (!context || !canManageUsers(context.actorRole)) {
      throw new AppError("Only administrators can create admin users.", 403);
    }
  }

  if (role === "PROFESSIONAL") {
    if (!context) {
      throw new AppError(
        "Authentication required to create professional user.",
        401,
      );
    }

    if (
      !canManageUsers(context.actorRole) &&
      context.actorRole !== "COMPANY_OWNER"
    ) {
      throw new AppError("Insufficient permissions.", 403);
    }
  }

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError("Email already registered.", 409);
  }

  if (role === "PROFESSIONAL") {
    if (!input.companyId?.trim()) {
      throw new AppError("Professional user must have companyId.", 400);
    }

    if (!input.displayName?.trim()) {
      throw new AppError("Professional user must have displayName.", 400);
    }

    const company = await findCompanyById(input.companyId.trim());
    if (!company) {
      throw new AppError("Company not found.", 404);
    }

    if (
      context?.actorRole === "COMPANY_OWNER" &&
      company.ownerId !== context.actorId
    ) {
      throw new AppError(
        "Company owner can only create professionals for their own company.",
        403,
      );
    }
  }

  const hashedPassword = hashPassword(input.password);

  const data: CreateUserData = {
    name: input.name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
  };

  if (input.phone !== undefined) {
    data.phone =
      input.phone === null ? null : normalizePhoneToE164(input.phone);
  }

  if (input.companyId !== undefined) {
    const normalizedCompanyId = input.companyId.trim();
    if (normalizedCompanyId) {
      data.companyId = normalizedCompanyId;
    }
  }

  if (input.displayName !== undefined) {
    const normalizedDisplayName = input.displayName.trim();
    if (normalizedDisplayName) {
      data.displayName = normalizedDisplayName;
    }
  }

  return createUser(data);
}

export async function signUpUser(
  input: SignUpUserInput,
  context?: UserActorContext,
) {
  return createUserAccount({ ...input, role: input.role ?? "CLIENT" }, context);
}

export async function listUsers(context: UserActorContext) {
  if (!canManageUsers(context.actorRole)) {
    throw new AppError("Insufficient permissions.", 403);
  }

  return findUsers();
}

export async function getUser(id: string, context: UserActorContext) {
  if (!canManageUsers(context.actorRole) && context.actorId !== id.trim()) {
    throw new AppError("Insufficient permissions.", 403);
  }

  const user = await findUserById(id.trim());
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return user;
}

export async function updateUserAccount(
  id: string,
  input: UpdateUserInput,
  context: UserActorContext,
) {
  const isSelf = context.actorId === id.trim();
  const isAdmin = canManageUsers(context.actorRole);
  if (!isSelf && !isAdmin) {
    throw new AppError("Insufficient permissions.", 403);
  }

  const existingUser = await findUserById(id.trim());
  if (!existingUser) {
    throw new AppError("User not found.", 404);
  }

  const data: UpdateUserInput = {};

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      throw new AppError("The name cannot be empty.", 400);
    }
    data.name = input.name.trim();
  }

  if (input.email !== undefined) {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      throw new AppError("The email format is invalid.", 400);
    }

    const userByEmail = await findUserByEmail(normalizedEmail);
    if (userByEmail && userByEmail.id !== existingUser.id) {
      throw new AppError("Email already registered.", 409);
    }

    data.email = normalizedEmail;
  }

  if (input.phone !== undefined) {
    if (input.phone === null) {
      data.phone = null;
    } else {
      data.phone = normalizePhoneToE164(input.phone);
    }
  }

  if (input.password !== undefined) {
    if (input.password.length < 6) {
      throw new AppError("The password must have at least 6 characters.", 400);
    }
    data.password = hashPassword(input.password);
  }

  if (input.role !== undefined) {
    if (!isAdmin) {
      throw new AppError("Only administrators can change user roles.", 403);
    }
    data.role = input.role;
  }

  if (input.companyId !== undefined) {
    if (!isAdmin) {
      throw new AppError("Only administrators can change company links.", 403);
    }
    if (!input.companyId.trim()) {
      throw new AppError("The companyId cannot be empty.", 400);
    }

    const company = await findCompanyById(input.companyId.trim());
    if (!company) {
      throw new AppError("Company not found.", 404);
    }

    data.companyId = input.companyId.trim();
  }

  if (input.displayName !== undefined) {
    if (!input.displayName.trim()) {
      throw new AppError("The displayName cannot be empty.", 400);
    }
    data.displayName = input.displayName.trim();
  }

  const nextRole = data.role ?? existingUser.role;
  const nextCompanyId = data.companyId ?? existingUser.companyId;
  const nextDisplayName = data.displayName ?? existingUser.displayName;

  if (nextRole === "PROFESSIONAL") {
    if (!nextCompanyId) {
      throw new AppError("Professional user must have companyId.", 400);
    }

    if (!nextDisplayName) {
      throw new AppError("Professional user must have displayName.", 400);
    }
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("At least one field must be provided to update.", 400);
  }

  return updateUser(existingUser.id, data);
}

export async function deleteUserAccount(id: string, context: UserActorContext) {
  const isSelf = context.actorId === id.trim();
  if (!isSelf && !canManageUsers(context.actorRole)) {
    throw new AppError("Insufficient permissions.", 403);
  }

  const user = await findUserById(id.trim());
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return deleteUser(user.id);
}

export async function getUsersByCompanyId(
  companyId: string,
  context: UserActorContext,
) {
  const normalizedCompanyId = companyId.trim();
  if (!normalizedCompanyId) {
    throw new AppError("Company id is required.", 400);
  }

  const company = await findCompanyById(normalizedCompanyId);
  if (!company) {
    throw new AppError("Company not found.", 404);
  }

  if (
    context.actorRole === "COMPANY_OWNER" &&
    company.ownerId !== context.actorId
  ) {
    throw new AppError("Insufficient permissions.", 403);
  }

  if (
    !canManageUsers(context.actorRole) &&
    context.actorRole !== "COMPANY_OWNER"
  ) {
    throw new AppError("Insufficient permissions.", 403);
  }

  return findUsersByCompanyId(normalizedCompanyId);
}

export async function searchClientUsersByEmailOrPhone(
  query: string,
  context: UserActorContext,
) {
  if (!canSearchClients(context.actorRole)) {
    throw new AppError("Insufficient permissions.", 403);
  }

  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new AppError("Search query is required.", 400);
  }

  if (normalizedQuery.includes("@")) {
    const normalizedEmail = normalizedQuery.toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      throw new AppError("The email format is invalid.", 400);
    }

    return findClientUsersByEmail(normalizedEmail);
  }

  const normalizedPhone = normalizePhoneToE164(normalizedQuery);
  return findClientUsersByPhone(normalizedPhone);
}
