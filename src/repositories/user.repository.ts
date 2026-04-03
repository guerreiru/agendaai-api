import { prisma } from "../lib/prisma";
import type { UserRole } from "../types/user";

export type CreateUserData = {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
  role: UserRole;
  companyId?: string;
  displayName?: string;
};

export type UpdateUserData = {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
  role?: UserRole;
  companyId?: string;
  displayName?: string;
};

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    omit: {
      password: true,
    },
    include: {
      ownedCompany: true,
      professionalServices: true,
    },
  });
}

export async function createUser(data: CreateUserData) {
  const createData: {
    name: string;
    email: string;
    phone?: string | null;
    password: string;
    role: UserRole;
    companyId?: string;
    displayName?: string;
  } = {
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
  };

  if (data.companyId !== undefined) {
    createData.companyId = data.companyId;
  }

  if (data.phone !== undefined) {
    createData.phone = data.phone;
  }

  if (data.displayName !== undefined) {
    createData.displayName = data.displayName;
  }

  return prisma.user.create({
    data: createData,
    omit: {
      password: true,
    },
  });
}

export async function findUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    omit: {
      password: true,
    },
  });
}

export async function updateUser(id: string, data: UpdateUserData) {
  return prisma.user.update({
    where: { id },
    data,
    omit: {
      password: true,
    },
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
    omit: {
      password: true,
    },
  });
}

export async function findUsersByCompanyId(companyId: string) {
  return prisma.user.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    omit: {
      password: true,
    },
  });
}

export async function findClientUsersByEmail(email: string) {
  return prisma.user.findMany({
    where: {
      role: "CLIENT",
      email,
    },
    orderBy: { createdAt: "desc" },
    omit: {
      password: true,
    },
  });
}

export async function findClientUsersByPhone(phone: string) {
  return prisma.user.findMany({
    where: {
      role: "CLIENT",
      phone,
    },
    orderBy: { createdAt: "desc" },
    omit: {
      password: true,
    },
  });
}
