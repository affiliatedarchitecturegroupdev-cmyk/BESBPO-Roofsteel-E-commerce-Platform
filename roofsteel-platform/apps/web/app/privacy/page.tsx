// Privacy Policy (POPIA) — complies with the Protection of Personal Information Act (South Africa).

export const metadata = { title: "Privacy Policy | Roofsteel Store", description: "How Roofsteel collects, uses, and protects your personal information under POPIA." };

export default function PrivacyPage() {
  return (
    <article className="legal-content" style={{ padding: "32px 16px", maxWidth: 680, margin: "0 auto" }}>
      <h1>Privacy Policy</h1>
      <p><em style={{ color: "var(--steel)", fontSize: 13 }}>Last updated: August 2026</em></p>

      <p>This Privacy Policy describes how Roofsteel collects, uses, and protects your personal information under the Protection of Personal Information Act (POPIA), Act 4 of 2013.</p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li>Name and email address</li>
        <li>Company name and registration number (for trade accounts)</li>
        <li>Delivery address and contact phone number</li>
        <li>Payment information (processed by our payment partners — we do not store card details)</li>
        <li>Order history and cart contents</li>
        <li>Product reviews and wishlist items</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>Process and fulfil your orders, including delivery</li>
        <li>Communicate with you about your orders and status</li>
        <li>Verify your identity and account type</li>
        <li>Provide pricing appropriate to your account tier</li>
        <li>Comply with legal obligations under SABS, NRCS, and tax regulations</li>
      </ul>

      <h2>3. Information Sharing</h2>
      <p>We share personal information with third parties only as necessary to fulfil your order: payment gateways (PayFast, Lulapay, PayJustNow), courier companies, and our accounting/ERP system. We do not sell your personal information.</p>

      <h2>4. Data Security</h2>
      <p>We use encrypted password storage (bcrypt), JWT-based authentication, and HTTPS for all data in transit. Payment card details are never stored on our servers.</p>

      <h2>5. Your Rights Under POPIA</h2>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion (subject to legal retention requirements)</li>
        <li>Object to processing for marketing</li>
        <li>Lodge a complaint with the Information Regulator</li>
      </ul>
      <p>Contact <a href="mailto:privacy@roofsteel.co.za">privacy@roofsteel.co.za</a> to exercise these rights.</p>

      <h2>6. Data Retention</h2>
      <p>We retain personal information while your account is active, and thereafter as required by law (tax records: 5 years; warranty records: duration of warranty).</p>
    </article>
  );
}
