// Terms of Purchase — transactional content for the e-commerce store, not a duplicate of the
// corporate site's brand pages (guidelines/12-storefront-ux-and-ia.md).

export const metadata = { title: "Terms of Purchase | Roofsteel Store", description: "Terms and conditions for purchasing from the Roofsteel online store." };

export default function TermsPage() {
  return (
    <article className="legal-content" style={{ padding: "32px 16px", maxWidth: 680, margin: "0 auto" }}>
      <h1>Terms of Purchase</h1>
      <p><em style={{ color: "var(--steel)", fontSize: 13 }}>Last updated: August 2026</em></p>

      <h2>1. Orders and Acceptance</h2>
      <p>All orders placed through the Roofsteel online store are subject to acceptance by Roofsteel. We reserve the right to decline or cancel any order, including for products that are out of stock or mispriced. Acceptance occurs when we dispatch the goods.</p>

      <h2>2. Pricing</h2>
      <p>All prices are in South African Rand (ZAR) and include VAT where applicable. Prices are resolved at checkout based on your account tier. Trade pricing is only available to approved trade accounts. The price applied to your order is the price at checkout, not at the time you added an item to your cart.</p>

      <h2>3. Made-to-Length, Cut-to-Order, and Fabricated-to-Order Products</h2>
      <p>Certain products are manufactured to your specifications. <strong>These are non-returnable.</strong> Because they are cut or manufactured to your exact specifications, they cannot be resold. Please verify all dimensions, gauges, profiles, and quantities before placing your order.</p>

      <h2>4. Payment</h2>
      <p>We accept the following, subject to your account tier:</p>
      <ul>
        <li><strong>PayFast</strong> — credit/debit card, EFT, Instant EFT (all tiers)</li>
        <li><strong>Lulapay</strong> — invoice financing for Trade, Contractor, and Project accounts</li>
        <li><strong>PayJustNow</strong> — pay in 3 instalments (Retail only)</li>
      </ul>

      <h2>5. Delivery</h2>
      <p>Delivery charges are calculated based on the weight of your order and your delivery province. Free delivery applies to orders over R 15,000 weighing 50 kg or less. See our <a href="/shipping">Shipping Policy</a>.</p>

      <h2>6. Returns</h2>
      <p>Stock items may be returned within 7 days of delivery. Made-to-Length, Cut-to-Order, and Fabricated-to-Order products are non-returnable. See our <a href="/returns">Returns Policy</a>.</p>

      <h2>7. Warranties</h2>
      <p>All products carry the manufacturer's warranty. Warranty does not cover damage caused by improper installation, handling, or storage.</p>

      <h2>8. Governing Law</h2>
      <p>These terms are governed by the laws of the Republic of South Africa.</p>
    </article>
  );
}
