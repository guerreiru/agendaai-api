import { prisma } from "../lib/prisma";
import type {
  ScheduleExceptionResponse,
  UpdateScheduleExceptionBody,
} from "../types/schedule-exception";
import type { ExceptionType } from "../../generated/prisma/enums";
import { AppError } from "../utils/app-error";

export class ScheduleExceptionRepository {
  async create(
    professionalId: string,
    type: ExceptionType,
    startDate: string,
    endDate: string,
    title: string,
    description?: string,
  ): Promise<ScheduleExceptionResponse> {
    const exception = await prisma.scheduleException.create({
      data: {
        professionalId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        title,
        description: description || null,
      },
    });

    return this.mapToResponse(exception);
  }

  async findById(id: string): Promise<ScheduleExceptionResponse | null> {
    const exception = await prisma.scheduleException.findUnique({
      where: { id },
    });

    return exception ? this.mapToResponse(exception) : null;
  }

  async findByProfessionalId(
    professionalId: string,
  ): Promise<ScheduleExceptionResponse[]> {
    const exceptions = await prisma.scheduleException.findMany({
      where: { professionalId },
      orderBy: { startDate: "asc" },
    });

    return exceptions.map((exc) => this.mapToResponse(exc));
  }

  async findByProfessionalIdAndDateRange(
    professionalId: string,
    startDate: string,
    endDate: string,
  ): Promise<ScheduleExceptionResponse[]> {
    const exceptions = await prisma.scheduleException.findMany({
      where: {
        professionalId,
        AND: [
          { startDate: { lte: new Date(endDate) } },
          { endDate: { gte: new Date(startDate) } },
        ],
      },
      orderBy: { startDate: "asc" },
    });

    return exceptions.map((exc) => this.mapToResponse(exc));
  }

  async update(
    id: string,
    professionalId: string,
    updates: UpdateScheduleExceptionBody,
  ): Promise<ScheduleExceptionResponse> {
    // First verify that the exception belongs to the professional
    const existing = await prisma.scheduleException.findUnique({
      where: { id },
    });

    if (!existing || existing.professionalId !== professionalId) {
      throw new AppError(
        "Schedule exception not found or does not belong to this professional",
        404,
      );
    }

    const updateData: any = {};

    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.startDate !== undefined)
      updateData.startDate = new Date(updates.startDate);
    if (updates.endDate !== undefined)
      updateData.endDate = new Date(updates.endDate);
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;

    const updated = await prisma.scheduleException.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponse(updated);
  }

  async delete(id: string, professionalId: string): Promise<void> {
    const existing = await prisma.scheduleException.findUnique({
      where: { id },
    });

    if (!existing || existing.professionalId !== professionalId) {
      throw new AppError(
        "Schedule exception not found or does not belong to this professional",
        404,
      );
    }

    await prisma.scheduleException.delete({
      where: { id },
    });
  }

  private mapToResponse(exception: any): ScheduleExceptionResponse {
    return {
      id: exception.id,
      professionalId: exception.professionalId,
      type: exception.type,
      startDate: exception.startDate.toISOString(),
      endDate: exception.endDate.toISOString(),
      title: exception.title,
      description: exception.description,
      createdAt: exception.createdAt.toISOString(),
      updatedAt: exception.updatedAt.toISOString(),
    };
  }
}

export const scheduleExceptionRepository = new ScheduleExceptionRepository();
