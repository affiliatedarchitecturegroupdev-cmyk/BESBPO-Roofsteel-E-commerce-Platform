import { Module, Controller, Post, Body, HttpCode } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";

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
    // TODO(Phase 2, guidelines/08-security-and-compliance.md): issue a real session
    // token/cookie here rather than returning the account payload alone — this is the
    // register/login business logic, not yet a complete session strategy.
  }
}

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
