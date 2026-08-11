// Trade-account approval transaction tests — verifies the atomic transaction in
// TradeAccountsService.approve(): Account.type and TradeAccountApplication.status
// must both update together, or neither does. Also tests:
//   - apply() blocks duplicate-pending applications
//   - apply() blocks already-trade accounts
//   - apply() allows re-application after rejection (upsert)
//
// We mock PrismaService's $transaction to verify both operations are passed in the
// same transaction batch, and mock the BullMQ queue.add to verify notification enqueuing.

import { Test } from "@nestjs/testing";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { AccountType, TradeApplicationStatus } from "@prisma/client";
import { TradeAccountsService } from "../src/trade-accounts/trade-accounts.service";
import { PrismaService } from "../src/common/prisma.service";
import { QUEUE_NAMES } from "../src/queue/queue.module";

function mockQueue() {
  return { add: jest.fn().mockResolvedValue(undefined) } as any;
}

function mockPrisma(overrides: Record<string, any> = {}) {
  const defaults = {
    account: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: "acc-1", type: AccountType.TRADE }),
    },
    tradeAccountApplication: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn().mockResolvedValue({ id: "app-1", status: TradeApplicationStatus.PENDING }),
      update: jest.fn().mockResolvedValue({
        id: "app-1",
        accountId: "acc-1",
        status: TradeApplicationStatus.APPROVED,
        companyName: "Test Co",
      }),
    },
    $transaction: jest.fn().mockImplementation(async (ops: any[]) => Promise.all(ops)),
  };
  return { ...defaults, ...overrides } as unknown as PrismaService;
}

describe("TradeAccountsService", () => {
  let service: TradeAccountsService;
  let prisma: PrismaService;
  let tradeQueue: any;

  beforeEach(async () => {
    prisma = mockPrisma();
    tradeQueue = mockQueue();
    const module = await Test.createTestingModule({
      providers: [
        TradeAccountsService,
        { provide: PrismaService, useValue: prisma },
        { provide: "BullQueue_trade-applications", useValue: tradeQueue },
      ],
    }).compile();
    service = module.get(TradeAccountsService);
  });

  describe("approve() — transaction atomicity", () => {
    it("updates Account.type AND application status in a single $transaction", async () => {
      (prisma as any).tradeAccountApplication.findUnique.mockResolvedValue({
        id: "app-1",
        accountId: "acc-1",
      });

      await service.approve("app-1");

      // $transaction must have been called with exactly 2 operations
      const txCall = (prisma as any).$transaction.mock.calls[0][0];
      expect(txCall).toHaveLength(2);
      // The first op is account.update (sets type to TRADE)
      expect((prisma as any).account.update).toHaveBeenCalledWith({
        where: { id: "acc-1" },
        data: { type: AccountType.TRADE },
      });
    });

    it("enqueues an 'approved' notification job after the transaction", async () => {
      (prisma as any).tradeAccountApplication.findUnique.mockResolvedValue({
        id: "app-1",
        accountId: "acc-1",
      });
      (prisma as any).account.findUnique.mockResolvedValue({ email: "test@example.com" });

      await service.approve("app-1");

      expect(tradeQueue.add).toHaveBeenCalledWith(
        "approved",
        expect.objectContaining({
          applicationId: "app-1",
          eventType: "approved",
          accountEmail: "test@example.com",
        })
      );
    });

    it("throws NotFound for a missing application", async () => {
      (prisma as any).tradeAccountApplication.findUnique.mockResolvedValue(null);
      await expect(service.approve("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("reject()", () => {
    it("updates status to REJECTED and enqueues a 'rejected' notification", async () => {
      (prisma as any).tradeAccountApplication.findUnique.mockResolvedValue({
        id: "app-1",
        accountId: "acc-1",
      });
      (prisma as any).account.findUnique.mockResolvedValue({ email: "test@example.com" });

      await service.reject("app-1", { rejectionReason: "Insufficient documentation" });

      expect((prisma as any).tradeAccountApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TradeApplicationStatus.REJECTED,
            rejectionReason: "Insufficient documentation",
          }),
        })
      );
      expect(tradeQueue.add).toHaveBeenCalledWith(
        "rejected",
        expect.objectContaining({
          eventType: "rejected",
          rejectionReason: "Insufficient documentation",
        })
      );
    });
  });

  describe("apply() — duplicate/re-application guards", () => {
    const dto = { companyName: "Test Co", registrationNo: "REG-001" };

    it("blocks an already-trade account", async () => {
      (prisma as any).account.findUnique.mockResolvedValue({
        id: "acc-1",
        type: AccountType.TRADE,
      });
      await expect(service.apply("acc-1", dto as any)).rejects.toThrow(ConflictException);
    });

    it("blocks a duplicate-pending application", async () => {
      (prisma as any).account.findUnique.mockResolvedValue({
        id: "acc-1",
        type: AccountType.RETAIL,
      });
      (prisma as any).tradeAccountApplication.findUnique.mockResolvedValue({
        id: "app-1",
        status: TradeApplicationStatus.PENDING,
      });
      await expect(service.apply("acc-1", dto as any)).rejects.toThrow(ConflictException);
    });

    it("allows re-application after rejection (upsert)", async () => {
      (prisma as any).account.findUnique.mockResolvedValue({
        id: "acc-1",
        type: AccountType.RETAIL,
      });
      (prisma as any).tradeAccountApplication.findUnique.mockResolvedValue({
        id: "app-1",
        status: TradeApplicationStatus.REJECTED,
      });

      await service.apply("acc-1", dto as any);

      // upsert must have been called (not create), resetting status to PENDING
      expect((prisma as any).tradeAccountApplication.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountId: "acc-1" },
          update: expect.objectContaining({
            status: TradeApplicationStatus.PENDING,
            rejectionReason: null,
          }),
        })
      );
    });
  });
});
