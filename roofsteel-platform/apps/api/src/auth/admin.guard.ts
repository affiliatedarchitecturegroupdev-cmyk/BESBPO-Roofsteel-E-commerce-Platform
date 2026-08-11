import { Injectable, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { JwtPayload } from "./auth.service";
import { lastValueFrom, from, of } from "rxjs";
import type { Observable } from "rxjs";

// AdminGuard composes JwtAuthGuard — it first requires a valid JWT (authentication), then
// checks the role claim (authorization). Never reuse a customer-facing route with a hidden
// admin branch (guidelines/01-api-design.md); all /v1/admin/* routes use this guard.
@Injectable()
export class AdminGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext) {
    const canActivateResult = super.canActivate(context);
    const result = typeof canActivateResult === "boolean"
      ? canActivateResult
      : await lastValueFrom(canActivateResult as Observable<boolean>);
    if (!result) return false;
    const request = context.switchToHttp().getRequest();
    const account: JwtPayload | undefined = request.user;
    if (!account || account.role !== "ADMIN") {
      throw new ForbiddenException("Admin access required");
    }
    return true;
  }
}
