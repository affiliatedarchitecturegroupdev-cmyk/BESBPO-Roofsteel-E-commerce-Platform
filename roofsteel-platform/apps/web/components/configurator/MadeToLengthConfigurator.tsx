"use client";

import { useMemo, useState } from "react";
import type { ProductDetail, MadeToLengthConfig } from "@roofsteel/shared-types";
import { formatZAR } from "../product/PriceDisplay";

const MAX_LENGTH_MM = 13200;

export interface MadeToLengthConfiguratorProps {
  product: ProductDetail;
  onAddToCart: (config: MadeToLengthConfig) => void;
}

// The flagship feature — see guidelines/04-made-to-length-configurator.md
// for the full constraint spec this implements. Gauge/profile/colour
// options come from product.mtlOptions (scoped to what THIS product
// actually offers, never the full catalogue-wide list — a real requirement
// from the guideline, not a nice-to-have).
//
// The live price formula here is deliberately identical to
// apps/api/src/cart/cart.service.ts's getCartWithPricing() —
// lineTotal = unitPrice * (lengthMm / 1000) * quantity — so what a
// customer sees while configuring is exactly what checkout will charge,
// not an approximation that could disagree with the backend.
export function MadeToLengthConfigurator({ product, onAddToCart }: MadeToLengthConfiguratorProps) {
  const options = product.mtlOptions;
  const [gaugeMm, setGaugeMm] = useState<number | null>(options?.gaugesMm[0] ?? null);
  const [profile, setProfile] = useState<string | null>(options?.profiles[0] ?? null);
  const [colour, setColour] = useState<string | null>(options?.colours[0] ?? null);
  const [lengthInput, setLengthInput] = useState("");

  const lengthMm = useMemo(() => {
    const metres = parseFloat(lengthInput);
    return Number.isFinite(metres) ? Math.round(metres * 1000) : null;
  }, [lengthInput]);

  const lengthError = useMemo(() => {
    if (lengthMm === null) return null;
    if (lengthMm <= 0) return "Enter a length greater than 0";
    if (lengthMm > MAX_LENGTH_MM) {
      return "Length exceeds the 13.2m maximum for Made to Length sheet — split into multiple lines or request a project quote";
    }
    return null;
  }, [lengthMm]);

  const isValid = gaugeMm !== null && profile !== null && colour !== null && lengthMm !== null && !lengthError;

  const livePrice = isValid ? product.pricing.applicablePrice * (lengthMm! / 1000) : null;

  if (!options) return null;

  function handleAddToCart() {
    if (!isValid) return;
    onAddToCart({ gaugeMm: gaugeMm!, profile: profile!, colour: colour!, lengthMm: lengthMm! });
  }

  return (
    <div className="configurator configurator--desktop">
      <div className="configurator-title">Configure Your Sheet</div>

      <div className="config-grid-desktop">
        <div>
          <label className="config-label" id="gauge-label">Gauge</label>
          <div className="pill-row" role="radiogroup" aria-labelledby="gauge-label">
            {options.gaugesMm.map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={gaugeMm === g}
                className={`pill${gaugeMm === g ? " active" : ""}`}
                onClick={() => setGaugeMm(g)}
              >
                {g.toFixed(2)}mm
              </button>
            ))}
          </div>

          <label className="config-label" id="profile-label">Profile</label>
          <div className="pill-row" role="radiogroup" aria-labelledby="profile-label">
            {options.profiles.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={profile === p}
                className={`pill${profile === p ? " active" : ""}`}
                onClick={() => setProfile(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="config-label" id="colour-label">Colour</label>
          <div className="swatch-row" role="radiogroup" aria-labelledby="colour-label">
            {options.colours.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={colour === c}
                aria-label={c}
                className={`swatch${colour === c ? " active" : ""}`}
                style={{ background: swatchColour(c) }}
                onClick={() => setColour(c)}
              />
            ))}
          </div>

          <label className="config-label" htmlFor="mtl-length">
            Length <span className="config-hint">Max 13.2m</span>
          </label>
          <div className="length-input-row">
            <input
              id="mtl-length"
              className="length-input"
              inputMode="decimal"
              value={lengthInput}
              onChange={(e) => setLengthInput(e.target.value)}
              aria-invalid={!!lengthError}
              aria-describedby={lengthError ? "mtl-length-error" : undefined}
              placeholder="0.0"
            />
            <span className="length-unit">m</span>
          </div>
          {lengthError && (
            <p id="mtl-length-error" role="alert" style={{ color: "var(--orange-dark)", fontSize: 11.5, marginTop: 6 }}>
              {lengthError}
            </p>
          )}
        </div>
      </div>

      <div className="config-live-price" aria-live="polite">
        <span>
          {lengthMm ? `${(lengthMm / 1000).toFixed(1)}m` : "—"} &times; {formatZAR(product.pricing.applicablePrice)}/{product.unit}
        </span>
        <span className="config-live-total">{livePrice !== null ? formatZAR(livePrice) : "—"}</span>
      </div>

      <button type="button" className="btn btn-primary btn-full" disabled={!isValid} onClick={handleAddToCart}>
        {isValid ? `Add to Cart — ${formatZAR(livePrice!)}` : "Complete configuration to continue"}
      </button>
    </div>
  );
}

// Maps a colour name to a swatch hex — placeholder mapping until real
// colour-chart data comes from the API (Phase 2). Not a business-logic
// concern, purely a visual swatch, so a simple lookup is fine here.
function swatchColour(name: string): string {
  const map: Record<string, string> = {
    Charcoal: "#3A3F42",
    Galvanised: "#6E7072",
    "Chromadec Green": "#4A5A3C",
    "Rustic Red": "#8C2F26",
  };
  return map[name] ?? "#7C8892";
}
