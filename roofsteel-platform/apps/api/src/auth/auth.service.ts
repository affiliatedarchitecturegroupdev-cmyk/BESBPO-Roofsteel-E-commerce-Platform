import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/prisma.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";
import { AccountType, Account } from "@prisma/client";

// Guidelines/08-security-and-compliance.md: passwords hashed (bcrypt, never reversible),
// session tokens never logged, refresh tokens are separate from access tokens. Access tokens
// are short-lived (15m default); refresh tokens are long-lived (7d default) and carry a
// different secret so a leaked access token can't be used to mint new ones.
const SALT_ROUNDS = 12;

export interface AuthResult {
  accountId: string;
  email: string;
  name: string;
  type: AccountType;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  type: AccountType;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

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
        type: AccountType.RETAIL,
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

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const account = await this.prisma.account.findUnique({ where: { id: payload.sub } });
    if (!account) {
      throw new UnauthorizedException("Account no longer exists");
    }

    return this.toAuthResult(account);
  }

  async validateAccount(accountId: string): Promise<Account | null> {
    return this.prisma.account.findUnique({ where: { id: accountId } });
  }

  private toAuthResult(account: Account): AuthResult {
    const payload: JwtPayload = {
      sub: account.id,
      email: account.email,
      type: account.type,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
    });

    return {
      accountId: account.id,
      email: account.email,
      name: account.name,
      type: account.type,
      accessToken,
      refreshToken,
    };
  }
}
