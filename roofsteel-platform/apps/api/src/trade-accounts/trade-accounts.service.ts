import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { PrismaService } from "../common/prisma.service";
import { ApplyForTradeAccountDto, RejectTradeAccountDto } from "./dto/trade-account.dto";
import { AccountType, TradeApplicationStatus } from "@prisma/client";
import { QUEUE_NAMES } from "../queue/queue.module";
import type { TradeApplicationJob } from "../queue/processors/trade-application.processor";

// This is the pattern named explicitly in CLAUDE.md and AGENTS.md — mirrored here, not
// reinvented: approve() updates Account.type AND application status in ONE transaction;
// create() blocks duplicate-pending and already-trade applications. See spec Section 4.3.
@Injectable()
export class TradeAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.TRADE_APPLICATIONS) private readonly tradeQueue: Queue<TradeApplicationJob>,
  ) {}

  async apply(accountId: string, dto: ApplyForTradeAccountDto) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);

    if (account.type === AccountType.TRADE) {
      throw new ConflictException("This account already has Trade Account pricing");
    }

    const existing = await this.prisma.tradeAccountApplication.findUnique({ where: { accountId } });
    if (existing && existing.status === TradeApplicationStatus.PENDING) {
      throw new ConflictException("A trade account application is already pending for this account");
    }

    // A previously REJECTED application can be re-applied for — upsert rather than a second
    // create() that would violate the accountId unique constraint.
    return this.prisma.tradeAccountApplication.upsert({
      where: { accountId },
      update: {
        status: TradeApplicationStatus.PENDING,
        companyName: dto.companyName,
        registrationNo: dto.registrationNo,
        rejectionReason: null,
        reviewedAt: null,
      },
      create: {
        accountId,
        companyName: dto.companyName,
        registrationNo: dto.registrationNo,
        status: TradeApplicationStatus.PENDING,
      },
    });
  }

  async approve(applicationId: string) {
    const application = await this.prisma.tradeAccountApplication.findUnique({ where: { id: applicationId } });
    if (!application) throw new NotFoundException(`Trade account application ${applicationId} not found`);

    // Single transaction — both writes succeed together or neither does. An account left with
    // type still RETAIL but an application marked APPROVED (or vice versa) is exactly the
    // inconsistent state this transaction exists to prevent.
    const [, updatedApplication] = await this.prisma.$transaction([
      this.prisma.account.update({
        where: { id: application.accountId },
        data: { type: AccountType.TRADE },
      }),
      this.prisma.tradeAccountApplication.update({
        where: { id: applicationId },
        data: { status: TradeApplicationStatus.APPROVED, reviewedAt: new Date() },
      }),
    ]);

    // Enqueue trade-application.approved notification job (guidelines/09).
    const account = await this.prisma.account.findUnique({ where: { id: updatedApplication.accountId } });
    await this.tradeQueue.add("approved", {
      applicationId,
      eventType: "approved",
      accountEmail: account?.email ?? "",
      companyName: updatedApplication.companyName,
    });

    return updatedApplication;
  }

  async reject(applicationId: string, dto: RejectTradeAccountDto) {
    const application = await this.prisma.tradeAccountApplication.findUnique({ where: { id: applicationId } });
    if (!application) throw new NotFoundException(`Trade account application ${applicationId} not found`);

    const updated = await this.prisma.tradeAccountApplication.update({
      where: { id: applicationId },
      data: { status: TradeApplicationStatus.REJECTED, rejectionReason: dto.rejectionReason, reviewedAt: new Date() },
    });

    // Enqueue trade-application.rejected notification job (guidelines/09).
    const account = await this.prisma.account.findUnique({ where: { id: updated.accountId } });
    await this.tradeQueue.add("rejected", {
      applicationId,
      eventType: "rejected",
      accountEmail: account?.email ?? "",
      companyName: updated.companyName,
      rejectionReason: dto.rejectionReason,
    });

    return updated;
  }

  async findByAccount(accountId: string) {
    return this.prisma.tradeAccountApplication.findUnique({ where: { accountId } });
  }

  // Admin-wide listing — see guidelines/01-api-design.md on checking whether an admin-wide
  // endpoint already exists before assuming it needs building from scratch. It doesn't exist
  // elsewhere in this codebase yet, so it's built here directly.
  async listPending() {
    return this.prisma.tradeAccountApplication.findMany({
      where: { status: TradeApplicationStatus.PENDING },
      include: { account: true },
      orderBy: { createdAt: "asc" },
    });
  }
}
