import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/prisma.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";
import { AccountType } from "@prisma/client";

// Guideline: guidelines/08-security-and-compliance.md — passwords hashed, never reversible,
// never logged. Session/JWT issuance is intentionally minimal here (a signed opaque token
// stub) — a full session strategy (refresh tokens, revocation) is Phase 2 scope per
// ROADMAP.md; this gives real register/login/password-verification logic to build on rather
// than leaving the whole module empty.
const SALT_ROUNDS = 12;

export interface AuthResult {
  accountId: string;
  email: string;
  name: string;
  type: AccountType;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.account.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const account = await this.prisma.account.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        companyName: dto.companyName,
        type: AccountType.RETAIL, // every account starts Retail — Trade requires a separate
        // application/approval flow (see trade-accounts module), never granted at registration
      },
    });

    return this.toAuthResult(account);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const account = await this.prisma.account.findUnique({ where: { email: dto.email } });
    // Deliberately identical error for "no such account" and "wrong password" — don't leak
    // which one it was, that's a real enumeration vulnerability if the messages differ.
    if (!account) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await bcrypt.compare(dto.password, account.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.toAuthResult(account);
  }

  private toAuthResult(account: {
    id: string;
    email: string;
    name: string;
    type: AccountType;
  }): AuthResult {
    return { accountId: account.id, email: account.email, name: account.name, type: account.type };
  }
}
