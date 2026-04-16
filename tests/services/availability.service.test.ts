import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as availabilityRepository from '../../src/repositories/availability.repository';
import * as userRepository from '../../src/repositories/user.repository';
import {
    createProfessionalAvailabilitiesBulk, createProfessionalAvailability,
    deleteProfessionalAvailability, getAvailability, listAllAvailabilities,
    listProfessionalAvailabilities, updateProfessionalAvailability
} from '../../src/services/availability.service';
import { AppError } from '../../src/utils/app-error';

vi.mock("../../src/repositories/availability.repository");
vi.mock("../../src/repositories/user.repository");

describe("availability.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates availability for professional", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "p-1",
      role: "PROFESSIONAL",
    } as never);
    vi.mocked(
      availabilityRepository.findOverlappingAvailability,
    ).mockResolvedValue(null);
    vi.mocked(availabilityRepository.createAvailability).mockResolvedValue({
      id: "a-1",
    } as never);

    const result = await createProfessionalAvailability({
      professionalId: "p-1",
      weekday: 1,
      startTime: "08:00",
      endTime: "18:00",
    });

    expect(result.id).toBe("a-1");
  });

  it("creates availabilities in bulk for professional", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "p-1",
      role: "PROFESSIONAL",
    } as never);
    vi.mocked(
      availabilityRepository.findAvailabilitiesByProfessional,
    ).mockResolvedValue([] as never);
    vi.mocked(availabilityRepository.createAvailabilitiesBulk).mockResolvedValue([
      { id: "a-1" },
      { id: "a-2" },
    ] as never);

    const result = await createProfessionalAvailabilitiesBulk({
      professionalId: "p-1",
      slots: [
        { weekday: 1, startTime: "08:00", endTime: "12:00" },
        { weekday: 2, startTime: "13:00", endTime: "18:00" },
      ],
    });

    expect(result).toHaveLength(2);
  });

  it("rejects overlapping slots within the same bulk payload", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "p-1",
      role: "PROFESSIONAL",
    } as never);

    await expect(
      createProfessionalAvailabilitiesBulk({
        professionalId: "p-1",
        slots: [
          { weekday: 1, startTime: "08:00", endTime: "12:00" },
          { weekday: 1, startTime: "11:00", endTime: "13:00" },
        ],
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects invalid weekday", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "p-1",
      role: "PROFESSIONAL",
    } as never);

    await expect(
      createProfessionalAvailability({
        professionalId: "p-1",
        weekday: 7,
        startTime: "08:00",
        endTime: "18:00",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects when start time >= end time", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "p-1",
      role: "PROFESSIONAL",
    } as never);

    await expect(
      createProfessionalAvailability({
        professionalId: "p-1",
        weekday: 1,
        startTime: "18:00",
        endTime: "08:00",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("lists professional availabilities", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "p-1",
    } as never);
    vi.mocked(
      availabilityRepository.findAvailabilitiesByProfessional,
    ).mockResolvedValue([{ id: "a-1" }] as never);

    const result = await listProfessionalAvailabilities("p-1");

    expect(result).toHaveLength(1);
  });

  it("lists all availabilities", async () => {
    vi.mocked(availabilityRepository.findAvailabilities).mockResolvedValue([
      { id: "a-1" },
    ] as never);

    const result = await listAllAvailabilities();

    expect(result).toHaveLength(1);
  });

  it("gets one availability", async () => {
    vi.mocked(availabilityRepository.findAvailabilityById).mockResolvedValue({
      id: "a-1",
    } as never);

    const result = await getAvailability("a-1");

    expect(result.id).toBe("a-1");
  });

  it("updates availability", async () => {
    vi.mocked(availabilityRepository.findAvailabilityById).mockResolvedValue({
      id: "a-1",
      professionalId: "p-1",
      weekday: 1,
      startTime: "08:00",
      endTime: "18:00",
    } as never);
    vi.mocked(
      availabilityRepository.findOverlappingAvailability,
    ).mockResolvedValue(null);
    vi.mocked(availabilityRepository.updateAvailability).mockResolvedValue({
      id: "a-1",
      startTime: "09:00",
    } as never);

    const result = await updateProfessionalAvailability("a-1", {
      startTime: "09:00",
    });

    expect(result.startTime).toBe("09:00");
  });

  it("deletes availability", async () => {
    vi.mocked(availabilityRepository.findAvailabilityById).mockResolvedValue({
      id: "a-1",
    } as never);
    vi.mocked(availabilityRepository.deleteAvailability).mockResolvedValue({
      id: "a-1",
    } as never);

    const result = await deleteProfessionalAvailability("a-1");

    expect(result.id).toBe("a-1");
  });
});
