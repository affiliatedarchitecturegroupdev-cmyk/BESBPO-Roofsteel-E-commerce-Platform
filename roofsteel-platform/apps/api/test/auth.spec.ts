// Auth/JWT tests — verifies password hashing (bcrypt), login validation, duplicate-email
// guard on register, and the "no such account" / "wrong password" identical-error rule
// (an enumeration defence). See guidelines/08-security-and-compliance.md.

import { Test } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { AccountType } from "@prisma/client";
import { AuthService } from "../src/auth/auth.service";
import { PrismaService } from "../src/common/prisma.service";

function mockPrisma(account: any = null) {
  return {
    account: {
      findUnique: jest.fn().mockResolvedValue(account),
      create: jest.fn().mockImplementation((args: any) => Promise.resolve({
        id: "acc-1",
        email: args.data.email,
        passwordHash: args.data.passwordHash,
        name: args.data.name,
        type: AccountType.RETAIL,
        role: "CUSTOMER",
      })),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
}

const mockJwtService = {
  sign: jest.fn().mockImplementation((payload: any) => `token-${payload.sub}`),
  verify: jest.fn(),
} as unknown as JwtService;

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  describe("register()", () => {
    it("creates a retail account with a bcrypt-hashed password", async () => {
      const result = await service.register({
        email: "new@test.com",
        password: "Password123!",
        name: "Test User",
      } as any);

      expect(result.accountId).toBe("acc-1");
      expect(result.type).toBe(AccountType.RETAIL);
      // The stored hash must not be the plaintext password.
      const createCall = (prisma as any).account.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe("Password123!");
      expect(bcrypt.compareSync("Password123!", createCall.data.passwordHash)).toBe(true);
    });

    it("throws Conflict for a duplicate email", async () => {
      (prisma as any).account.findUnique.mockResolvedValue({ id: "existing", email: "taken@test.com" });
      await expect(
        service.register({ email: "taken@test.com", password: "x", name: "Y" } as any)
      ).rejects.toThrow(ConflictException);
    });

    it("issues access + refresh tokens", async () => {
      const result = await service.register({
        email: "new@test.com",
        password: "Password123!",
        name: "Test User",
      } as any);
      expect(result.accessToken).toMatch(/^token-/);
      expect(result.refreshToken).toMatch(/^token-/);
    });
  });

  describe("login()", () => {
    it("logs in with a valid email + password", async () => {
      const hash = await bcrypt.hash("Password123!", 12);
      (prisma as any).account.findUnique.mockResolvedValue({
        id: "acc-1",
        email: "user@test.com",
        passwordHash: hash,
        name: "User",
        type: AccountType.RETAIL,
        role: "CUSTOMER",
      });
      const result = await service.login({ email: "user@test.com", password: "Password123!" } as any);
      expect(result.accountId).toBe("acc-1");
    });

    it("returns the same error for a non-existent email (no enumeration)", async () => {
      (prisma as any).account.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: "nobody@test.com", password: "x" } as any)
      ).rejects.toThrow(UnauthorizedException);
    });

    it("returns the same error for a wrong password (no enumeration)", async () => {
      const hash = await bcrypt.hash("CorrectPassword!", 12);
      (prisma as any).account.findUnique.mockResolvedValue({
        id: "acc-1",
        email: "user@test.com",
        passwordHash: hash,
        type: AccountType.RETAIL,
        role: "CUSTOMER",
      });
      await expect(
        service.login({ email: "user@test.com", password: "WrongPassword!" } as any)
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("changePassword()", () => {
    it("rejects if the current password is wrong", async () => {
      const hash = await bcrypt.hash("OldPassword!", 12);
      (prisma as any).account.findUnique.mockResolvedValue({
        id: "acc-1",
        passwordHash: hash,
      });
      await expect(
        service.changePassword("acc-1", "WrongOldPassword!", "NewPassword!")
      ).rejects.toThrow(UnauthorizedException);
    });

    it("updates the password hash when the current password is correct", async () => {
      const hash = await bcrypt.hash("OldPassword!", 12);
      (prisma as any).account.findUnique.mockResolvedValue({
        id: "acc-1",
        passwordHash: hash,
      });
      const result = await service.changePassword("acc-1", "OldPassword!", "NewPassword!");
      expect(result.success).toBe(true);
      const updateCall = (prisma as any).account.update.mock.calls[0][0];
      expect(updateCall.data.passwordHash).not.toBe(hash);
      expect(bcrypt.compareSync("NewPassword!", updateCall.data.passwordHash)).toBe(true);
    });
  });
});
