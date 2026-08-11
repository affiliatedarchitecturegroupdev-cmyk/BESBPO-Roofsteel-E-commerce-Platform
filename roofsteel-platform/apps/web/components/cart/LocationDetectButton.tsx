"use client";

import { useState, useCallback } from "react";

// LocationDetector — uses the browser Geolocation API to detect the user's location,
// then reverse-geocodes via a lightweight fetch to determine province/city for the
// delivery-address form pre-fill. The user must explicitly grant geolocation permission
// (browser prompt) — this is never automatic.
//
// Per guidelines/15-delivery-courier-and-location.md: the province determines freight
// zones and delivery lead times. The geolocation pre-fill is a convenience, not a
// requirement — the user can always manually select/override the province.
//
// This component is a controlled hook + button pair: it calls onLocationDetected with
// the resolved { province, city, postalCode } when geolocation + reverse-geocode succeed.

export interface DetectedLocation {
  province: string;
  city?: string;
  postalCode?: string;
  lat: number;
  lng: number;
}

// Map SA province names from the reverse-geocoder to our enum values.
const PROVINCE_MAP: Record<string, string> = {
  "Gauteng": "GAUTENG",
  "KwaZulu-Natal": "KWAZULU_NATAL",
  "KwaZulu Natal": "KWAZULU_NATAL",
  "Western Cape": "WESTERN_CAPE",
  "Limpopo": "LIMPOPO",
  "Mpumalanga": "MPUMALANGA",
  "Eastern Cape": "EASTERN_CAPE",
  "North West": "NORTH_WEST",
  "North-West": "NORTH_WEST",
};

export function useLocationDetection() {
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async (): Promise<DetectedLocation | null> => {
    setDetecting(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: 300_000, // 5 min cache
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;

      // Reverse-geocode using BigDataCloud's free API (no API key required).
      // Returns the admin area (province) and locality (city) for SA coordinates.
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
      const data = await res.json();

      const provinceName = data.principalSubdivision || "";
      const province = PROVINCE_MAP[provinceName] ?? "";

      if (!province) {
        throw new Error(`Could not determine SA province from location: ${provinceName}`);
      }

      return {
        province,
        city: data.city || data.locality || undefined,
        postalCode: data.postcode || undefined,
        lat,
        lng,
      };
    } catch (err) {
      const msg = err instanceof GeolocationPositionError
        ? geolocationErrorMessage(err)
        : err instanceof Error ? err.message : "Location detection failed";
      setError(msg);
      return null;
    } finally {
      setDetecting(false);
    }
  }, []);

  return { detect, detecting, error };
}

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location permission denied — you can enter your address manually below";
    case err.POSITION_UNAVAILABLE:
      return "Location is unavailable — please enter your address manually";
    case err.TIMEOUT:
      return "Location request timed out — please enter your address manually";
    default:
      return "Location detection failed — please enter your address manually";
  }
}

// The button component — renders a "Use my location" button that triggers detection.
export function LocationDetectButton({
  onDetected,
  className,
}: {
  onDetected: (loc: DetectedLocation) => void;
  className?: string;
}) {
  const { detect, detecting, error } = useLocationDetection();

  const handleClick = async () => {
    const loc = await detect();
    if (loc) onDetected(loc);
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={detecting}
        className={`rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 ${className ?? ""}`}
      >
        {detecting ? "Detecting…" : "📍 Use my location"}
      </button>
      {error && <p className="text-xs text-amber-600">{error}</p>}
    </div>
  );
}
