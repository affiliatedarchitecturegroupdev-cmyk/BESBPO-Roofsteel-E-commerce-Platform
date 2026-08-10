import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { StockMovementType } from "@prisma/client";

// Inventory service — stock reservation and release logic for the order lifecycle.
// qtyReserved tracks stock held against placed-but-unpaid orders; it's released
// (converted to SOLD or returned to qtyOnHand) when the order is paid or cancelled.
// See guidelines/13-listings-cms-inventory-sales.md Section "Stock reservation".

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // Reserve stock for an order's STOCK-fulfilment line items. Called at order creation.
  // Uses a transaction to atomically decrement qtyOnHand, increment qtyReserved, and
  // record the movements. Skips non-STOCK items (Made-to-Length, Cut-to-Order).
  async reserveStock(orderId: string, items: { productId: string; quantity: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { stockLevels: true },
        });
        if (!product || product.fulfilmentType !== "STOCK") continue;

        for (const stock of product.stockLevels) {
          if (stock.qtyOnHand < item.quantity) {
            throw new Error(`Insufficient stock for ${product.sku} at ${stock.locationId}`);
          }
          await tx.stockLevel.update({
            where: { id: stock.id },
            data: {
              qtyOnHand: { decrement: item.quantity },
              qtyReserved: { increment: item.quantity },
            },
          });
          await tx.stockMovement.create({
            data: {
              stockLevelId: stock.id,
              type: StockMovementType.RESERVED,
              quantity: item.quantity,
              reference: orderId,
            },
          });
          break; // Reserve from the first location with sufficient stock
        }
      }
    });
  }

  // Release reserved stock back to qtyOnHand when an order is cancelled or
  // the payment window expires. The inverse of reserveStock.
  async releaseStock(orderId: string) {
    const movements = await this.prisma.stockMovement.findMany({
      where: { reference: orderId, type: StockMovementType.RESERVED },
    });
    if (movements.length === 0) return;

    return this.prisma.$transaction(async (tx) => {
      for (const m of movements) {
        await tx.stockLevel.update({
          where: { id: m.stockLevelId },
          data: {
            qtyOnHand: { increment: m.quantity },
            qtyReserved: { decrement: m.quantity },
          },
        });
        await tx.stockMovement.create({
          data: {
            stockLevelId: m.stockLevelId,
            type: StockMovementType.RELEASED,
            quantity: m.quantity,
            reference: orderId,
          },
        });
      }
    });
  }

  // Convert reserved stock to sold when payment is confirmed. The qtyReserved
  // decrement is the only change — qtyOnHand was already decremented at reservation.
  async confirmSale(orderId: string) {
    const movements = await this.prisma.stockMovement.findMany({
      where: { reference: orderId, type: StockMovementType.RESERVED },
    });
    if (movements.length === 0) return;

    return this.prisma.$transaction(async (tx) => {
      for (const m of movements) {
        await tx.stockLevel.update({
          where: { id: m.stockLevelId },
          data: { qtyReserved: { decrement: m.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            stockLevelId: m.stockLevelId,
            type: StockMovementType.SOLD,
            quantity: m.quantity,
            reference: orderId,
          },
        });
      }
    });
  }
}
