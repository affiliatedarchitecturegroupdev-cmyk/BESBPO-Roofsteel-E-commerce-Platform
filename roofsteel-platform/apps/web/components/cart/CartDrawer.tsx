"use client";

import { Icon } from "../Icon";
import { formatZAR } from "../product/PriceDisplay";

export interface CartLine {
  id: string;
  productName: string;
  mtlSummary?: string;
  quantity: number;
  lineTotal: number;
}

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  subtotal: number;
  freeDeliveryThreshold: number;
  onQuantityChange: (lineId: string, quantity: number) => void;
  onCheckout: () => void;
}

// Validated against design-mockup/mockup.html's Cart Drawer screen — see
// docs/DEVELOPMENT-LOG.md. Deliberately shows the Made-to-Length config
// summary inline per line, and the free-delivery progress bar, both real
// UX decisions from guidelines/12-storefront-ux-and-ia.md, not just visual
// flourishes.
export function CartDrawer({
  open,
  onClose,
  lines,
  subtotal,
  freeDeliveryThreshold,
  onQuantityChange,
  onCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const remaining = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPct = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  return (
    <div role="dialog" aria-label="Shopping cart" aria-modal="true" className="cart-drawer-overlay">
      <div className="cart-drawer-header">
        <span>Your Cart ({lines.length})</span>
        <button type="button" onClick={onClose} aria-label="Close cart">
          <Icon name="close" size={22} color="#1A1F24" />
        </button>
      </div>

      {lines.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--steel)" }}>
          Your cart is empty.
        </div>
      ) : (
        <>
          <div className="free-delivery-bar">
            <div className="free-delivery-track">
              <div className="free-delivery-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="free-delivery-label">
              {remaining > 0
                ? `Add ${formatZAR(remaining)} more for free delivery`
                : "You qualify for free delivery"}
            </div>
          </div>

          {lines.map((line) => (
            <div className="cart-line" key={line.id}>
              <div className="cart-line-img" aria-hidden="true" />
              <div className="cart-line-info">
                <div className="cart-line-name">{line.productName}</div>
                {line.mtlSummary && <div className="cart-line-config">{line.mtlSummary}</div>}
                <div className="cart-line-qty-row">
                  <div className="qty-stepper">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => onQuantityChange(line.id, Math.max(1, line.quantity - 1))}
                    >
                      –
                    </button>
                    <span className="qty-val">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => onQuantityChange(line.id, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="cart-line-price">{formatZAR(line.lineTotal)}</span>
                </div>
              </div>
            </div>
          ))}

          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>{formatZAR(subtotal)}</span>
            </div>
            <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={onCheckout}>
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
