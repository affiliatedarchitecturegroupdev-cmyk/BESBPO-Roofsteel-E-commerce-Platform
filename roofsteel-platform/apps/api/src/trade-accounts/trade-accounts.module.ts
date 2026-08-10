import { Module, Controller, Get, Post, Param, Body, Query } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { TradeAccountsService } from "./trade-accounts.service";
import { ApplyForTradeAccountDto, RejectTradeAccountDto } from "./dto/trade-account.dto";

@Controller("trade-accounts")
export class TradeAccountsController {
  constructor(private readonly tradeAccounts: TradeAccountsService) {}

  // TODO(Phase 2, auth): accountId from the authenticated session, not a query param.
  @Post("apply")
  apply(@Query("accountId") accountId: string, @Body() dto: ApplyForTradeAccountDto) {
    return this.tradeAccounts.apply(accountId, dto);
  }

  @Get("me")
  findMine(@Query("accountId") accountId: string) {
    return this.tradeAccounts.findByAccount(accountId);
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
