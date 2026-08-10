// JSON-LD structured data for the storefront. Rendered as a <script type="application/ld+json">
// tag. This helps search engines understand the store, its products, and its policies.
// See guidelines/12-storefront-ux-and-ia.md and Google's structured data guidelines.

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Store-level structured data — used on the home page.
export function storeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Roofsteel Store",
    description: "Steel, roofing, and structural materials online store.",
    url: "https://store.roofsteel.co.za",
    logo: "https://store.roofsteel.co.za/icon-192.png",
    sameAs: [
      "https://www.roofsteel.co.za",
    ],
  };
}
