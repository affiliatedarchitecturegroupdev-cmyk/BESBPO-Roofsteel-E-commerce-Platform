import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// Apply @UseGuards(JwtAuthGuard) on any controller/route that requires authentication.
// Returns 401 if no valid Bearer token is present. The validated JwtPayload is available
// via the @CurrentAccount() param decorator.
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
