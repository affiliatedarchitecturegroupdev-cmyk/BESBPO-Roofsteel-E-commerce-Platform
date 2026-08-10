"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Cut/bend service selector — for FABRICATED_TO_ORDER reinforcing steel (rebar).
// SANS 282 defines standard bend shapes for reinforcing steel. The buyer selects
// a shape code and dimensions; standard codes add to cart, non-standard shapes
// route to the quote/RFQ flow. See guidelines/04-made-to-length-configurator.md
// and docs/DEVELOPMENT-PLAN.md Task 2.16.

export interface SANS282ShapeCode {
  code: string;
  name: string;
  description: string;
  standard: boolean;
}

// SANS 282 standard shape codes (subset — the most common for SA construction).
const SHAPE_CODES: SANS282ShapeCode[] = [
  { code: "00", name: "Straight bar", description: "No bends — straight length only", standard: true },
  { code: "11", name: "L-bend (90°)", description: "Single 90° bend at one end", standard: true },
  { code: "12", name: "L-bend (180°)", description: "Single 180° hook bend at one end", standard: true },
  { code: "13", name: "U-bend", description: "180° bends at both ends (stirrup)", standard: true },
  { code: "21", name: "Square stirrup", description: "Four 90° bends — closed square link", standard: true },
  { code: "22", name: "Rectangular stirrup", description: "Four 90° bends — closed rectangular link", standard: true },
  { code: "31", name: "Double L", description: "90° bends at both ends, same direction", standard: true },
  { code: "33", name: "Cranked bar", description: "Two bends offset — sloped section", standard: true },
  { code: "51", name: "Z-bend", description: "Two 90° bends in opposite directions", standard: true },
  { code: "99", name: "Non-standard", description: "Custom shape — requires quote/RFQ", standard: false },
];

interface CutBendSelectorProps {
  sku: string;
  unit: string;
  onAddToCart: (config: { shapeCode: string; length: number; quantity: number; dimensions?: string }) => void;
}

export function CutBendSelector({ sku, unit, onAddToCart }: CutBendSelectorProps) {
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [length, setLength] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [dimensions, setDimensions] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedShape = SHAPE_CODES.find((s) => s.code === selectedCode);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedCode) {
      setError("Please select a shape code.");
      return;
    }
    if (!selectedShape?.standard) {
      // Non-standard shape routes to quote/RFQ flow, not cart
      router.push(`/quote/request?sku=${encodeURIComponent(sku)}&shapeCode=${selectedCode}`);
      return;
    }
    const len = parseFloat(length);
    if (!len || len <= 0) {
      setError("Please enter a valid length in metres.");
      return;
    }
    if (quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    onAddToCart({
      shapeCode: selectedCode,
      length: len,
      quantity,
      dimensions: dimensions || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="cut-bend-selector" style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Cut &amp; Bend Service (SANS 282)</h3>

      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label" htmlFor="shape-code">Shape Code</label>
        <select
          id="shape-code"
          className="form-input"
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
        >
          <option value="">Select a shape code…</option>
          {SHAPE_CODES.map((shape) => (
            <option key={shape.code} value={shape.code}>
              {shape.code} — {shape.name}
            </option>
          ))}
        </select>
        {selectedShape && (
          <p style={{ fontSize: 12, color: "var(--steel)", marginTop: 4 }}>
            {selectedShape.description}
          </p>
        )}
      </div>

      {selectedShape?.standard && (
        <>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" htmlFor="cut-length">Length ({unit})</label>
            <input
              id="cut-length"
              type="number"
              step="0.01"
              min="0.1"
              className="form-input"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="e.g. 6.0"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" htmlFor="cut-qty">Quantity</label>
            <input
              id="cut-qty"
              type="number"
              min="1"
              className="form-input"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" htmlFor="cut-dims">Bend dimensions (optional)</label>
            <input
              id="cut-dims"
              type="text"
              className="form-input"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              placeholder="e.g. A=500mm, B=300mm"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Add to Cart
          </button>
        </>
      )}

      {selectedShape && !selectedShape.standard && (
        <button type="submit" className="btn btn-outline-dark" style={{ width: "100%" }}>
          Request Quote for Custom Shape
        </button>
      )}

      {error && <div className="form-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}
    </form>
  );
}
