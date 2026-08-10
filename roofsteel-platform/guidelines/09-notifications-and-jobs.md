# Notifications & Background Jobs (BullMQ)

## Job types needed across Phases 3-5

Order lifecycle (status-change notifications), trade application approved/rejected, back-in-stock,
low-stock (admin-facing), and once payments are built, payment-confirmed/payment-failed. Each is
a separate BullMQ job type, not one generic "notification" job with a type field buried in the
payload — separate job types make retries, monitoring, and failure handling per-type possible.

## The rule that matters most here

A notification-triggering side effect needs wiring into every real place the underlying state
can change, not just the obvious one. This is a real lesson, not a hypothetical: on the sister
platform this pattern comes from, back-in-stock notifications initially missed the general
product-update path (which also allows direct stock-quantity edits) and only caught the
dedicated restock() method — both had to be wired deliberately. Before considering a
notification job "done," grep for every place the field it depends on can actually change, not
just the method named for that purpose.

## Idempotency

Any job that fires on a state transition (order status change, stock crossing zero) should
check the state transition actually happened, not just that the job was triggered — this
protects against a job being enqueued twice for the same event, which BullMQ's at-least-once
delivery guarantee makes a real possibility, not a theoretical one.

## Channels

Email and SMS at launch (matches spec Section 3.1's adaptation — WhatsApp/live-chat deferred
with the Elixir service in ADR-001). Build the job payload and template rendering decoupled from
the send channel, so adding a channel later (WhatsApp, when it's built) doesn't mean rewriting
every job that triggers a notification — it means adding one more delivery method to an already
decoupled system.

## What order-status notifications need to cover

Matches spec Section 3.6/11.1's adaptation: Processing, Packed, Dispatched, Out for Delivery,
Delivered — plus the trade-specific and Made-to-Length-specific states worth considering:
"Roll-forming in progress" is a genuinely informative status for a Made-to-Length order that a
generic "Processing" label doesn't capture. Don't force every order through the same status
vocabulary if a fulfilment-type-specific status is more accurate and useful.

## Queue monitoring

Not built yet — worth a basic dashboard or logging discipline before Phase 5 launch so a stuck
or failing job queue is visible rather than silently accumulating unsent notifications. Doesn't
need to be sophisticated; needs to exist.
