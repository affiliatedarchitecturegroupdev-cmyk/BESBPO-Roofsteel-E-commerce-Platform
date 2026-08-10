// FAQ — answers the questions this category of customer (trade buyers, contractors) asks,
// not generic retail questions.

export const metadata = { title: "FAQ | Roofsteel Store", description: "Frequently asked questions about ordering from Roofsteel." };

export default function FaqPage() {
  const faqs: Array<{ q: string; a: React.ReactNode }> = [
    {
      q: "What's the difference between Retail, Trade, Contractor, and Project pricing?",
      a: (
        <>
          <p>Retail is the standard price. Trade pricing is a discount available to approved trade accounts (businesses with a valid registration number). Contractor and Project tiers offer further discounts for large-volume and project-specific orders.</p>
          <p>To apply for a trade account, visit the <a href="/trade/apply">Trade Account Application</a> page.</p>
        </>
      ),
    },
    {
      q: "What does 'Made-to-Length' mean, and why can't I return these products?",
      a: (
        <p>Made-to-Length roofing sheets are roll-formed to your exact specified length, gauge, profile, and colour. Because they are cut to your specifications, they cannot be resold. Please double-check all dimensions before ordering. See our <a href="/returns">Returns Policy</a>.</p>
      ),
    },
    {
      q: "How is my delivery cost calculated?",
      a: (
        <p>Delivery is based on total order weight and your delivery province. See our <a href="/shipping">Shipping Policy</a> for weight bands and province multipliers. Free delivery applies to orders over R 15,000 weighing 50 kg or less.</p>
      ),
    },
    {
      q: "How long will my order take?",
      a: (
        <p>The estimated ready time shown at checkout is the maximum lead time across all items. Stock items are ready immediately; MtL/CtO/FtO items have their own lead times. Your order is only ready once the slowest item is ready.</p>
      ),
    },
    {
      q: "Can I get a quote before placing an order?",
      a: (
        <p>Yes — Project-tier customers can submit a Request for Quote (RFQ) with line items from their cart. Visit the <a href="/quote/request">Quote Request</a> page.</p>
      ),
    },
    {
      q: "What payment methods are available to me?",
      a: (
        <ul>
          <li><strong>Retail:</strong> PayFast (card/EFT) and PayJustNow (pay in 3)</li>
          <li><strong>Trade / Contractor / Project:</strong> PayFast and Lulapay (invoice financing)</li>
        </ul>
      ),
    },
    {
      q: "Do you provide mill test certificates and compliance documents?",
      a: (
        <p>Yes. All steel products are supplied with relevant compliance documentation (mill test certificates, NRCS Letters of Authority, SABS certificates) where applicable.</p>
      ),
    },
    {
      q: "Can I save items for later?",
      a: (
        <p>Yes — you can create multiple named wishlists (e.g., one per project) and add products to them. Visit your <a href="/account/wishlists">Wishlists</a> page to manage them.</p>
      ),
    },
  ];

  return (
    <article className="legal-content" style={{ padding: "32px 16px", maxWidth: 680, margin: "0 auto" }}>
      <h1>Frequently Asked Questions</h1>
      <div className="faq-list">
        {faqs.map((faq, i) => (
          <details key={i} className="faq-item">
            <summary>{faq.q}</summary>
            <div className="faq-answer">{faq.a}</div>
          </details>
        ))}
      </div>
    </article>
  );
}
