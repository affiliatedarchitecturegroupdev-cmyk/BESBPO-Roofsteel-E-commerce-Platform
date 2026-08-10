// Returns Policy — the non-returnable policy for MtL / CtO / FtO products must be stated
// explicitly per fulfilment type (guidelines/12, spec Section 3.2).

export const metadata = { title: "Returns Policy | Roofsteel Store", description: "Roofsteel returns policy, including non-returnable items." };

export default function ReturnsPage() {
  return (
    <article className="legal-content" style={{ padding: "32px 16px", maxWidth: 680, margin: "0 auto" }}>
      <h1>Returns &amp; RMA Policy</h1>
      <p><em style={{ color: "var(--steel)", fontSize: 13 }}>Last updated: August 2026</em></p>

      <h2>1. Returnable Items (Stock Products)</h2>
      <p>Standard stock products may be returned within <strong>7 days of delivery</strong> if:</p>
      <ul>
        <li>The product is in its original, unused condition and packaging</li>
        <li>You have proof of purchase (order number)</li>
        <li>The product is not damaged or altered</li>
      </ul>
      <p>Contact <a href="mailto:orders@roofsteel.co.za">orders@roofsteel.co.za</a> with your order number and reason for return.</p>

      <h2>2. Non-Returnable Items</h2>
      <p>The following are <strong>non-returnable</strong> because they are manufactured or cut to your exact specifications:</p>
      <ul>
        <li><strong>Made-to-Length roofing sheets</strong> — roll-formed to your specified length, gauge, profile, and colour</li>
        <li><strong>Cut-to-Order reinforcing steel</strong> — cut and bent to your specified dimensions and shape codes</li>
        <li><strong>Fabricated-to-Order structural steel</strong> — welded and fabricated to your specifications</li>
      </ul>
      <p>Please verify all dimensions before placing your order. If unsure, contact our sales team first.</p>

      <h2>3. Damaged or Incorrect Items</h2>
      <p>If your order arrives damaged or incorrect, contact us within <strong>48 hours of delivery</strong> with photos. We will arrange a replacement or refund at no cost.</p>

      <h2>4. Refund Process</h2>
      <p>Approved refunds are processed to the original payment method within 5-7 business days.</p>

      <h2>5. Trade and Project Account Returns</h2>
      <p>Handled on a case-by-case basis — contact your account manager.</p>

      <h2>6. Compliance Documents</h2>
      <p>All steel products are supplied with relevant compliance documentation (mill test certificates, NRCS Letters of Authority, SABS certificates) where applicable.</p>
    </article>
  );
}
