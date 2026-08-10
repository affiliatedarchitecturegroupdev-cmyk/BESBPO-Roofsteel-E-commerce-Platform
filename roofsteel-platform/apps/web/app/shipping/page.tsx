// Shipping Policy — province-banded freight system + free-delivery threshold. Rates are
// illustrative (ADR-008) but the structure is real (orders.service.ts).

export const metadata = { title: "Shipping Policy | Roofsteel Store", description: "Roofsteel delivery and shipping policy, including freight zones and free delivery." };

export default function ShippingPage() {
  return (
    <article className="legal-content" style={{ padding: "32px 16px", maxWidth: 680, margin: "0 auto" }}>
      <h1>Shipping &amp; Delivery</h1>
      <p><em style={{ color: "var(--steel)", fontSize: 13 }}>Last updated: August 2026</em></p>

      <h2>1. Delivery Areas</h2>
      <p>Roofsteel delivers to all major provinces in South Africa, currently from our flagship yard in KwaZulu-Natal, with a planned Gauteng depot (Phase 2).</p>

      <h2>2. Freight Calculation</h2>
      <p>Delivery charges are based on two factors: total order weight (freight band) and delivery province (distance multiplier).</p>

      <h3>Weight Bands (Illustrative)</h3>
      <table className="data-table">
        <thead><tr><th>Weight</th><th>Base Rate</th></tr></thead>
        <tbody>
          <tr><td>0 – 50 kg</td><td>R 450</td></tr>
          <tr><td>50 – 500 kg</td><td>R 900</td></tr>
          <tr><td>500 – 2,000 kg</td><td>R 2,200</td></tr>
          <tr><td>2,000 – 8,000 kg</td><td>R 4,500</td></tr>
          <tr><td>8,000 kg+</td><td>R 8,500 + R 550/t</td></tr>
        </tbody>
      </table>

      <h3>Province Multipliers</h3>
      <table className="data-table">
        <thead><tr><th>Province</th><th>Multiplier</th></tr></thead>
        <tbody>
          <tr><td>KwaZulu-Natal</td><td>1.0× (local)</td></tr>
          <tr><td>Gauteng</td><td>1.3×</td></tr>
          <tr><td>Mpumalanga</td><td>1.3×</td></tr>
          <tr><td>Eastern Cape</td><td>1.2×</td></tr>
          <tr><td>Limpopo</td><td>1.5×</td></tr>
          <tr><td>North West</td><td>1.6×</td></tr>
          <tr><td>Western Cape</td><td>1.9×</td></tr>
        </tbody>
      </table>

      <h2>3. Free Delivery</h2>
      <p>Free delivery when order subtotal is R 15,000+ <strong>and</strong> total weight is 50 kg or less. The weight ceiling prevents waiving a real heavy-freight run.</p>

      <h2>4. Delivery Timeframes</h2>
      <ul>
        <li><strong>Stock items</strong> — dispatched within 1-2 business days of payment</li>
        <li><strong>Made-to-Length / Cut-to-Order / Fabricated-to-Order</strong> — lead time applies (shown at checkout)</li>
      </ul>
      <p>Your order is ready when the slowest line is ready — we communicate the maximum lead time, not an average.</p>

      <h2>5. Tracking</h2>
      <p>You will receive a tracking number once your order is dispatched. Tracking is also available in your account under Order History.</p>

      <h2>6. Collection</h2>
      <p>Collection from our KZN yard is available by arrangement — contact <a href="mailto:orders@roofsteel.co.za">orders@roofsteel.co.za</a>.</p>
    </article>
  );
}
