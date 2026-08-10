import { Module, Controller, Post, Put, Body, HttpCode, UseGuards } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaService } from "../common/prisma.service";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentAccount } from "./current-account.decorator";
import { RegisterDto, LoginDto, RefreshDto, UpdateProfileDto, ChangePasswordDto } from "./dto/auth.dto";
import type { JwtPayload } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentAccount() account: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(account.sub, dto);
  }

  @Post("change-password")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentAccount() account: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(account.sub, dto.currentPassword, dto.newPassword);
  }
}

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
      signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
