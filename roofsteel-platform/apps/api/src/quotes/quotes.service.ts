import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { CreateQuoteDto, UpdateQuoteStatusDto, PriceQuoteItemDto } from "./dto/quotes.dto";
import { QuoteStatus } from "@prisma/client";

// The Project/Tender tier RFQ engine — spec Section 4.3. Project pricing is bespoke and
// negotiated, never computed automatically (guidelines/06-pricing-engine.md, "Where
// Project/Tender pricing diverges from the formula"). A quote is created as DRAFT by the
// customer, submitted (DRAFT → SENT), then an admin prices each line and either accepts
// or declines. The customer can accept (SENT → ACCEPTED) or let it expire.
@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(accountId: string, dto: CreateQuoteDto) {
    const quoteNumber = this.generateQuoteNumber();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    return this.prisma.quote.create({
      data: {
        quoteNumber,
        accountId,
        status: QuoteStatus.DRAFT,
        validUntil,
        items: {
          create: dto.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: 0, // unpriced until admin responds — never present a price of 0 as real
          })),
        },
      },
      include: { items: true },
    });
  }

  async submit(quoteId: string, accountId: string) {
    const quote = await this.findOwned(quoteId, accountId);
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(`Cannot submit a quote in ${quote.status} status`);
    }
    return this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.SENT },
      include: { items: true },
    });
  }

  async listByAccount(accountId: string) {
    return this.prisma.quote.findMany({
      where: { accountId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(quoteId: string, accountId?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true, account: { select: { name: true, email: true, companyName: true } } },
    });
    if (!quote) throw new NotFoundException(`Quote ${quoteId} not found`);
    if (accountId && quote.accountId !== accountId) {
      throw new NotFoundException(`Quote ${quoteId} not found`);
    }
    return quote;
  }

  // Admin endpoints — real admin guard is Phase 4 (task 4.1). These are the operations an
  // admin performs to price and respond to a submitted quote.
  async listByStatus(status?: QuoteStatus) {
    return this.prisma.quote.findMany({
      where: status ? { status } : undefined,
      include: { items: true, account: { select: { name: true, email: true, companyName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async priceItem(quoteId: string, itemId: string, dto: PriceQuoteItemDto) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true },
    });
    if (!quote) throw new NotFoundException(`Quote ${quoteId} not found`);
    if (quote.status !== QuoteStatus.SENT) {
      throw new BadRequestException("Can only price items on a submitted quote");
    }

    const item = quote.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException(`Quote item ${itemId} not found`);

    return this.prisma.quoteItem.update({
      where: { id: itemId },
      data: { unitPrice: dto.unitPrice },
    });
  }

  async updateStatus(quoteId: string, dto: UpdateQuoteStatusDto) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException(`Quote ${quoteId} not found`);

    this.assertValidTransition(quote.status, dto.status);

    return this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: dto.status },
      include: { items: true },
    });
  }

  private assertValidTransition(current: QuoteStatus, next: QuoteStatus) {
    const valid: Record<QuoteStatus, QuoteStatus[]> = {
      DRAFT: [QuoteStatus.SENT],
      SENT: [QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED],
      ACCEPTED: [],
      EXPIRED: [],
      DECLINED: [],
    };
    if (!valid[current].includes(next)) {
      throw new BadRequestException(`Cannot transition quote from ${current} to ${next}`);
    }
  }

  private async findOwned(quoteId: string, accountId: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote || quote.accountId !== accountId) {
      throw new NotFoundException(`Quote ${quoteId} not found`);
    }
    return quote;
  }

  private generateQuoteNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `RFQ-${ts}-${rand}`;
  }
}
