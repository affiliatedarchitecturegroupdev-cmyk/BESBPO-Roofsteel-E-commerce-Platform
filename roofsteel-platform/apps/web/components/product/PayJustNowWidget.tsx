"use client";

import { useMemo } from "react";

// PayJustNow widget — shows "as low as RX/month" on the PDP/cart for Retail customers.
// Retail tier only per guidelines/05-payments.md. The parent page is responsible for only
// rendering this for RETAIL accounts; this component just does the display math.
//
// PayJustNow splits the total into 3 interest-free instalments. The first payment is due at
// checkout; the remaining two are due at 30-day intervals. The widget shows the per-instalment
// amount and a link to PayJustNow for full terms.

interface PayJustNowWidgetProps {
  amount: number; // total order/product price in ZAR
  className?: string;
}

export function PayJustNowWidget({ amount, className }: PayJustNowWidgetProps) {
  // PayJustNow "pay in 3" — divide total by 3, rounded up to the nearest rand.
  const perInstalment = useMemo(() => Math.ceil(amount / 3), [amount]);

  if (amount < 50) return null; // PayJustNow minimum purchase threshold

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm ${className ?? ""}`}
      data-testid="payjustnow-widget"
    >
      <span className="font-medium text-blue-900">
        or 3 interest-free payments of R{perInstalment.toFixed(0)}
      </span>
      <a
        href="https://payjustnow.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        with PayJustNow
      </a>
    </div>
  );
}
