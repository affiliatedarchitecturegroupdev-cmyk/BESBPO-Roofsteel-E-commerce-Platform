import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService, JwtPayload } from "./auth.service";

// Extracts the Bearer token from the Authorization header and validates it against
// JWT_ACCESS_SECRET. The validated payload (sub = accountId, email, type) is attached
// to the request as `req.user`, which the @CurrentAccount decorator reads.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const account = await this.authService.validateAccount(payload.sub);
    if (!account) {
      throw new UnauthorizedException("Account no longer exists");
    }
    return payload;
  }
}
