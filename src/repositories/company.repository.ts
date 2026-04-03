import { prisma } from "../lib/prisma";
import type { CreateCompanyInput, UpdateCompanyInput } from "../types/company";

export async function findCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
  });
}

export async function findCompanyBySlug(slug: string) {
  return prisma.company.findUnique({
    where: { slug },
  });
}

export async function findCompanyPublicProfileBySlug(slug: string) {
  return prisma.company.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      services: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
        },
      },
      professionals: {
        where: {
          role: "PROFESSIONAL",
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
    },
  });
}

export async function findCompanies() {
  return prisma.company.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createCompany(data: CreateCompanyInput) {
  return prisma.company.create({
    data,
  });
}

export async function updateCompany(id: string, data: UpdateCompanyInput) {
  return prisma.company.update({
    where: { id },
    data,
  });
}

export async function deleteCompany(id: string) {
  return prisma.company.delete({
    where: { id },
  });
}
