# Payment Integration Guide

Covers PayFast, Lulapay, and PayJustNow — the three gateways decided in ADR-003, with Lulapay
now approved and unblocked per ADR-006.

## The Strategy Pattern — one interface, one class per gateway

Every gateway implements the same interface (already sketched conceptually in the original
Besbpo blueprint's Section 7.1 and carried into apps/api/src/orders/):

    export interface PaymentStrategy {
      initialize(order: Order): Promise<PaymentSession>;
      verify(payload: unknown): Promise<boolean>;
      refund(transactionId: string, amount?: number): Promise<boolean>;
    }

OrdersService depends on PaymentStrategy, never on a specific gateway's SDK directly. This is
what lets Roofsteel run three gateways side by side without three different checkout code paths,
and what makes it possible to add or retire a gateway later without touching OrdersService itself.

## Which gateway, for which tier

From ADR-003 — enforce this in the checkout flow, not just as a UI suggestion:

| Account tier | Available gateways |
|---|---|
| Retail | PayFast, PayJustNow |
| Trade | PayFast, Lulapay |
| Contractor / Project | PayFast, Lulapay |

PayJustNow (consumer BNPL) simply isn't offered as an option outside the Retail tier — don't
build it as available-but-discouraged, build it as genuinely not present in the gateway list a
Trade/Contractor/Project customer sees at checkout.

## PayFast specifics

- Two different signature algorithms for two different flows — this is a real, easy-to-get-wrong
  detail: checkout/ITN (Instant Transaction Notification) uses PayFast's declared field order;
  the Refunds API uses alphabetical field order plus signed headers. Don't assume one signature
  method works for both.
- ITN webhook handler must be idempotent — PayFast can and will retry a notification; a
  double-processed ITN must not double-fulfil an order. Check current order status before
  transitioning it, don't blindly apply the ITN payload.

## Lulapay specifics

Lulapay is B2B invoice-financing BNPL: Roofsteel gets paid upfront in full, Lulapay collects from
the trade customer over 30-90 days (up to 6 months), and Lulapay carries the credit assessment
and collection risk — not Roofsteel. Partner onboarding is approved (ADR-006); the actual API key
still needs to be issued before this goes live in any real environment. Build the LulapayStrategy
class against their real Partner API once credentials exist — don't guess at an API shape from
the marketing description; confirm the real integration contract when onboarding completes.

## PayJustNow specifics

Widget-based on the PDP/cart (shows an "as low as RX/month" indicator) plus an API-based
checkout flow for the actual interest-free instalment agreement. Retail tier only, per the table
above.

## Order status transitions triggered by payment events

PENDING_PAYMENT -> PROCESSING happens only on a verified payment confirmation (ITN for PayFast,
the equivalent webhook/callback for Lulapay and PayJustNow) — never on the customer simply
reaching a "thank you" page client-side, which proves nothing about whether payment actually
succeeded.

## Refunds

PaymentsService (not OrdersService) owns refund logic — keep payment-specific operations out of
the general orders module, mirroring the separation already decided for this kind of concern on
the sister platform this pattern is drawn from. A refund notification to the customer fires only
after the gateway confirms the refund succeeded, never optimistically before that confirmation.
