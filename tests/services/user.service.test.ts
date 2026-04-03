import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../src/utils/app-error";
import {
  deleteUserAccount,
  getUser,
  listUsers,
  signUpUser,
  updateUserAccount,
} from "../../src/services/user.service";
import * as userRepository from "../../src/repositories/user.repository";
import * as companyRepository from "../../src/repositories/company.repository";

vi.mock("../../src/repositories/user.repository");
vi.mock("../../src/repositories/company.repository");

describe("user.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a client user", async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.createUser).mockResolvedValue({
      id: "u-1",
      name: "Maria",
      email: "maria@email.com",
      role: "CLIENT",
    } as never);

    const result = await signUpUser({
      name: "Maria",
      email: "maria@email.com",
      password: "123456",
    });

    expect(result.id).toBe("u-1");
    expect(userRepository.createUser).toHaveBeenCalledTimes(1);
  });

  it("normalizes phone to E.164 when creating user", async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.createUser).mockResolvedValue({
      id: "u-2",
      name: "Ana",
      email: "ana@email.com",
      phone: "+5511999998888",
      role: "CLIENT",
    } as never);

    await signUpUser({
      name: "Ana",
      email: "ana@email.com",
      phone: "(11) 99999-8888",
      password: "123456",
    });

    expect(userRepository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ phone: "+11999998888" }),
    );
  });

  it("requires company data for professional user", async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);

    await expect(
      signUpUser({
        name: "Joao",
        email: "joao@email.com",
        password: "123456",
        role: "PROFESSIONAL",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects professional user creation without authenticated manager", async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);

    await expect(
      signUpUser({
        name: "Joao",
        email: "joao@email.com",
        password: "123456",
        role: "PROFESSIONAL",
        companyId: "c-1",
        displayName: "Joao Prof",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("lists users for admin", async () => {
    vi.mocked(userRepository.findUsers).mockResolvedValue([
      { id: "u-1" },
    ] as never);

    const users = await listUsers({ actorId: "admin-1", actorRole: "ADMIN" });

    expect(users).toHaveLength(1);
  });

  it("gets one user by id", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "u-1",
    } as never);

    const user = await getUser("u-1", {
      actorId: "u-1",
      actorRole: "CLIENT",
    });

    expect(user.id).toBe("u-1");
  });

  it("updates user with company validation", async () => {
    vi.mocked(userRepository.findUserById)
      .mockResolvedValueOnce({
        id: "u-1",
        email: "user@email.com",
        role: "CLIENT",
      } as never)
      .mockResolvedValueOnce({ id: "owner-1" } as never);
    vi.mocked(companyRepository.findCompanyById).mockResolvedValue({
      id: "c-1",
    } as never);
    vi.mocked(userRepository.updateUser).mockResolvedValue({
      id: "u-1",
      companyId: "c-1",
    } as never);

    const updated = await updateUserAccount(
      "u-1",
      { companyId: "c-1" },
      { actorId: "admin-1", actorRole: "ADMIN" },
    );

    expect(updated.companyId).toBe("c-1");
  });

  it("deletes existing user", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: "u-1",
    } as never);
    vi.mocked(userRepository.deleteUser).mockResolvedValue({
      id: "u-1",
    } as never);

    const deleted = await deleteUserAccount("u-1", {
      actorId: "u-1",
      actorRole: "CLIENT",
    });

    expect(deleted.id).toBe("u-1");
  });
});
