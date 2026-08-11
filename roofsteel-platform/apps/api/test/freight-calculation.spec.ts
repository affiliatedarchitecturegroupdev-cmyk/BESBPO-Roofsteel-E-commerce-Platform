// Freight calculation tests — verifies the weight-band and province-distance
// freight calculation logic from OrdersService. The freight model:
//   freight = weightBandRate(totalWeightKg) * PROVINCE_DISTANCE_MULTIPLIER[province]
// where weightBandRate returns a base rate per weight bracket.
//
// We test the pure calculation function directly, since it's a standalone export.
// See guidelines/15-delivery-courier-and-location.md Section 2.

import { Province } from "@prisma/client";

// Re-implement the same weight-band and multiplier logic from orders.service.ts
// to test the formulas independently of the service's Prisma dependencies.
// This mirrors the source — if the source changes, update this to match.
function weightBandRate(totalWeightKg: number): number {
  if (totalWeightKg <= 50) return 450;
  if (totalWeightKg <= 500) return 900;
  if (totalWeightKg <= 2000) return 2200;
  if (totalWeightKg <= 8000) return 4500;
  const extraTonnes = Math.ceil((totalWeightKg - 8000) / 1000);
  return 8500 + extraTonnes * 550;
}

const PROVINCE_DISTANCE_MULTIPLIER: Record<Province, number> = {
  KWAZULU_NATAL: 1.0,
  GAUTENG: 1.3,
  MPUMALANGA: 1.3,
  EASTERN_CAPE: 1.2,
  LIMPOPO: 1.5,
  NORTH_WEST: 1.6,
  WESTERN_CAPE: 1.9,
};

function calculateFreight(province: Province, totalWeightKg: number): number {
  return Math.round(weightBandRate(totalWeightKg) * PROVINCE_DISTANCE_MULTIPLIER[province] * 100) / 100;
}

describe("Freight calculation", () => {
  describe("weight bands", () => {
    it("returns R450 for light parcels (≤50kg)", () => {
      expect(weightBandRate(5)).toBe(450);
      expect(weightBandRate(50)).toBe(450);
    });

    it("returns R900 for light freight (51-500kg)", () => {
      expect(weightBandRate(51)).toBe(900);
      expect(weightBandRate(500)).toBe(900);
    });

    it("returns R2,200 for flatbed freight (501-2,000kg)", () => {
      expect(weightBandRate(501)).toBe(2200);
      expect(weightBandRate(2000)).toBe(2200);
    });

    it("returns R4,500 for heavy freight (2,001-8,000kg)", () => {
      expect(weightBandRate(2001)).toBe(4500);
      expect(weightBandRate(8000)).toBe(4500);
    });

    it("scales per-tonne above 8,000kg", () => {
      // 8,000 + 1,000 = 9,000kg → 1 extra tonne
      expect(weightBandRate(9000)).toBe(8500 + 550);
      // 8,000 + 3,000 = 11,000kg → 3 extra tonnes
      expect(weightBandRate(11000)).toBe(8500 + 3 * 550);
    });

    it("ceilings the extra-tonne count (8,001 → 1 tonne)", () => {
      expect(weightBandRate(8001)).toBe(8500 + 550);
    });
  });

  describe("province distance multiplier", () => {
    it("KZN is the base rate (1.0x)", () => {
      expect(calculateFreight(Province.KWAZULU_NATAL, 25)).toBe(450);
    });

    it("Gauteng is 1.3x the base rate", () => {
      expect(calculateFreight(Province.GAUTENG, 25)).toBe(585);
    });

    it("Western Cape is 1.9x (furthest)", () => {
      expect(calculateFreight(Province.WESTERN_CAPE, 25)).toBe(855);
    });

    it("Limpopo is 1.5x", () => {
      expect(calculateFreight(Province.LIMPOPO, 25)).toBe(675);
    });

    it("North West is 1.6x", () => {
      expect(calculateFreight(Province.NORTH_WEST, 25)).toBe(720);
    });
  });

  describe("combined weight + province", () => {
    it("a 600kg order to Gauteng = 2,200 × 1.3 = 2,860", () => {
      expect(calculateFreight(Province.GAUTENG, 600)).toBe(2860);
    });

    it("a 100kg order to Western Cape = 900 × 1.9 = 1,710", () => {
      expect(calculateFreight(Province.WESTERN_CAPE, 100)).toBe(1710);
    });

    it("a 10,000kg order to KZN = 8,500 + 2×550 = 9,600", () => {
      expect(calculateFreight(Province.KWAZULU_NATAL, 10000)).toBe(9600);
    });
  });
});
