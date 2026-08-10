import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "./auth.service";

// Usage: @CurrentAccount() account: JwtPayload
// Injects the authenticated account's JWT payload (sub, email, type) into a controller
// method. Must be used alongside @UseGuards(JwtAuthGuard) — without the guard, there's
// no validated payload on the request. The `type` field is the AccountType that
// PricingService and every tier-aware endpoint needs (guidelines/01-api-design.md,
// "Auth context in services").
export const CurrentAccount = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const payload = request.user as JwtPayload;
    return data ? payload?.[data] : payload;
  }
);
