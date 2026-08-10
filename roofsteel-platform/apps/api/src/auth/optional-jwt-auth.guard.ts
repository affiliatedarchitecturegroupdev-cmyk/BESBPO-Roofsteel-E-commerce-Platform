import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { JwtPayload } from "./auth.service";

// For endpoints that are publicly accessible but benefit from knowing the caller's
// account type if they're authenticated (e.g., GET /v1/products — public browsing,
// but a Trade customer sees trade pricing). Unlike JwtAuthGuard, this guard does NOT
// throw 401 when no token is present — it simply leaves request.user undefined, and
// the @CurrentAccount() decorator returns undefined, which the controller falls back
// from to RETAIL. When a token IS present and valid, the payload is attached as normal.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: unknown, user: JwtPayload | undefined): JwtPayload | undefined {
    return user;
  }
}
