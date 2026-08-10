// See guidelines/05-payments.md — every gateway implements this same interface.
// OrdersService depends on PaymentStrategy, never on a specific gateway SDK directly.

import { AccountType } from "@prisma/client";

export interface PaymentSession {
  gatewayReference: string;
  redirectUrl?: string;
  // Present for gateways (Lulapay) where the customer doesn't leave the site for a redirect
  // flow — the checkout continues in-page and the gateway confirms asynchronously.
  requiresRedirect: boolean;
}

export interface OrderForPayment {
  id: string;
  orderNumber: string;
  total: number;
  guestEmail?: string | null;
  accountId?: string | null;
}

export interface PaymentStrategy {
  readonly gatewayName: "PAYFAST" | "LULAPAY" | "PAYJUSTNOW";

  initialize(order: OrderForPayment): Promise<PaymentSession>;

  // Verifies an inbound webhook/ITN payload's signature and authenticity. Must be idempotent —
  // see guidelines/05-payments.md on PayFast's ITN retry behaviour specifically, but the rule
  // applies to every gateway: a retried notification must never double-process an order.
  verify(payload: unknown, headers?: Record<string, string>): Promise<boolean>;

  refund(transactionId: string, amountCents?: number): Promise<boolean>;
}

// Which gateways are available to which account tier — see guidelines/05-payments.md's table.
// Enforced here so the rule lives in exactly one place, not duplicated in the frontend and
// re-derived (possibly incorrectly) in the backend.
export const GATEWAYS_BY_TIER: Record<AccountType, Array<PaymentStrategy["gatewayName"]>> = {
  RETAIL: ["PAYFAST", "PAYJUSTNOW"],
  TRADE: ["PAYFAST", "LULAPAY"],
  CONTRACTOR: ["PAYFAST", "LULAPAY"],
  PROJECT: ["PAYFAST", "LULAPAY"],
};
