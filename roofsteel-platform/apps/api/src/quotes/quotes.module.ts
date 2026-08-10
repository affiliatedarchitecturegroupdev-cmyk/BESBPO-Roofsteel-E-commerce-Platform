import { Module, Controller, Get, Post, Put, Param, Body, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { QuotesService } from "./quotes.service";
import { CreateQuoteDto, UpdateQuoteStatusDto, PriceQuoteItemDto } from "./dto/quotes.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentAccount } from "../auth/current-account.decorator";
import type { JwtPayload } from "../auth/auth.service";
import { QuoteStatus } from "@prisma/client";

@Controller("quotes")
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  // Customer endpoints — authenticated, scoped to the caller's own quotes.
  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentAccount() account: JwtPayload) {
    return this.quotes.listByAccount(account.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentAccount() account: JwtPayload, @Body() dto: CreateQuoteDto) {
    return this.quotes.create(account.sub, dto);
  }

  @Post(":id/submit")
  @UseGuards(JwtAuthGuard)
  submit(@CurrentAccount() account: JwtPayload, @Param("id") id: string) {
    return this.quotes.submit(id, account.sub);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentAccount() account: JwtPayload, @Param("id") id: string) {
    return this.quotes.findById(id, account.sub);
  }

  // Admin endpoints — real admin guard is Phase 4 (task 4.1). Left unguarded for now with
  // the same honest comment pattern used elsewhere; move behind /v1/admin/ once the guard
  // exists. Literal-segment routes before parameterised (guidelines/01-api-design.md).
  @Get("all")
  listAll(@Query("status") status?: QuoteStatus) {
    return this.quotes.listByStatus(status);
  }

  @Put(":id/items/:itemId/price")
  priceItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: PriceQuoteItemDto
  ) {
    return this.quotes.priceItem(id, itemId, dto);
  }

  @Put(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateQuoteStatusDto) {
    return this.quotes.updateStatus(id, dto);
  }
}

@Module({
  controllers: [QuotesController],
  providers: [QuotesService, PrismaService],
  exports: [QuotesService],
})
export class QuotesModule {}
