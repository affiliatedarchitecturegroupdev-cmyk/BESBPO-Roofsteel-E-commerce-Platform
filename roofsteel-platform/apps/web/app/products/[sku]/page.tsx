import { ProductPurchasePanel } from "../../../components/product/ProductPurchasePanel";
import type { ProductDetail } from "@roofsteel/shared-types";

// TODO(Phase 2): replace this fixture with a real GET /v1/products/:sku
// fetch — this file stays a Server Component (guidelines/03-frontend.md),
// fetching data server-side and passing it down as serializable props.
// mtlOptions here matches what a real IBR 686 line actually offers per its
// catalogue spec string, not the full catalogue-wide gauge/profile/colour
// range — guidelines/04-made-to-length-configurator.md's explicit
// requirement.
const PRODUCT: ProductDetail = {
  sku: "RS-1000",
  name: "IBR 686 Roofing Sheet",
  specs: "0.40 / 0.50 / 0.53 / 0.58 / 0.80mm gauge; full standard colour range; galvanised or colour-coated",
  unit: "m²",
  fulfilmentType: "MADE_TO_LENGTH",
  category: { slug: "steel-roofing-sheets", name: "Steel Roofing Sheets" },
  subcategory: { name: "IBR Profile" },
  segments: ["INDUSTRIAL", "COMMERCIAL", "CIVIL", "RESIDENTIAL"],
  pricing: {
    landedCost: 145,
    retailPrice: 210.25,
    tradePrice: 193.43,
    volumePrice: 185.02,
    applicablePrice: 210.25,
    pricingKey: "Steel Roofing Sheets — Made to Length",
    costIsReal: true,
  },
  mtlOptions: {
    gaugesMm: [0.4, 0.53, 0.58, 0.8],
    profiles: ["IBR"],
    colours: ["Charcoal", "Galvanised", "Chromadec Green", "Rustic Red"],
    maxLengthMm: 13200,
  },
};

// params.sku drives the real fetch once Phase 2 wires this up — the
// fixture above stands in regardless of which SKU is requested for now.
export default function ProductPage({ params }: { params: { sku: string } }) {
  const product = PRODUCT;

  return (
    <div className="pdp-desktop-grid">
      <div className="pdp-gallery pdp-gallery--desktop" aria-hidden="true" />

      <div className="pdp-desktop-right">
        <ProductPurchasePanel product={product} tier="TRADE" />

        <div className="section" style={{ marginTop: 24 }}>
          <div className="accordion-row">
            <span>Specifications</span>
          </div>
          <div className="accordion-row">
            <span>Compliance &amp; Certificates</span>
          </div>
        </div>
      </div>
    </div>
  );
}
