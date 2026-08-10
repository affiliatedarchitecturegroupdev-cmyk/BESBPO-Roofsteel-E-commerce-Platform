import { Module, Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { TradeAccountsService } from "./trade-accounts.service";
import { ApplyForTradeAccountDto, RejectTradeAccountDto } from "./dto/trade-account.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentAccount } from "../auth/current-account.decorator";
import type { JwtPayload } from "../auth/auth.service";

@Controller("trade-accounts")
export class TradeAccountsController {
  constructor(private readonly tradeAccounts: TradeAccountsService) {}

  @Post("apply")
  @UseGuards(JwtAuthGuard)
  apply(@CurrentAccount() account: JwtPayload, @Body() dto: ApplyForTradeAccountDto) {
    return this.tradeAccounts.apply(account.sub, dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentAccount() account: JwtPayload) {
    return this.tradeAccounts.findByAccount(account.sub);
  }

  // Admin-only in practice — real admin guard is Phase 4 scope (admin panel), matching
  // guidelines/01-api-design.md's /v1/admin/... convention. Left under the main resource path
  // for now since there's no admin auth guard to attach yet; move under /admin once it exists.
  @Get("pending")
  listPending() {
    return this.tradeAccounts.listPending();
  }

  @Post(":id/approve")
  approve(@Param("id") id: string) {
    return this.tradeAccounts.approve(id);
  }

  @Post(":id/reject")
  reject(@Param("id") id: string, @Body() dto: RejectTradeAccountDto) {
    return this.tradeAccounts.reject(id, dto);
  }
}

@Module({
  controllers: [TradeAccountsController],
  providers: [TradeAccountsService, PrismaService],
})
export class TradeAccountsModule {}
