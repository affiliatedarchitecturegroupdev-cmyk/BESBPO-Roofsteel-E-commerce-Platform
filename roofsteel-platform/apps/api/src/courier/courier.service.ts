import { Injectable, Logger } from "@nestjs/common";
import { Province } from "@prisma/client";

// Courier service — integrates with external courier/freight providers for shipment booking
// and tracking. Per guidelines/15-delivery-courier-and-location.md and ADR-017 (still open):
// the actual provider (The Courier Guy, RAM, Dawn Wing, or heavy-freight for structural steel)
// is determined by the order's weight band.
//
// This service provides a unified interface regardless of which provider is used:
//   - bookShipment(): creates a shipment with the provider, returns a tracking number
//   - trackShipment(): queries the provider for current tracking status
//
// The provider API base URL and credentials are configured via env vars. In development/sandbox
// mode (COURIER_SANDBOX=true), it returns mock tracking numbers without hitting a real API.

export interface ShipmentRequest {
  orderNumber: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: Province;
  postalCode: string;
  totalWeightKg: number;
  parcelCount: number;
  notes?: string;
}

export interface ShipmentResponse {
  trackingNumber: string;
  courierProvider: string;
  bookingReference: string;
  estimatedDeliveryDays: number;
}

export interface TrackingStatus {
  trackingNumber: string;
  status: "PENDING" | "COLLECTED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "EXCEPTION";
  statusDescription: string;
  lastUpdate: Date;
  events: TrackingEvent[];
}

interface TrackingEvent {
  timestamp: Date;
  location: string;
  description: string;
}

@Injectable()
export class CourierService {
  private readonly logger = new Logger(CourierService.name);
  private readonly sandbox: boolean;
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.sandbox = process.env.COURIER_SANDBOX === "true";
    this.apiUrl = process.env.COURIER_API_URL ?? "";
    this.apiKey = process.env.COURIER_API_KEY ?? "";
  }

  // Book a shipment with the courier provider. In sandbox mode, returns a mock tracking
  // number immediately without an HTTP call. In production, POSTs to the provider's API.
  async bookShipment(req: ShipmentRequest): Promise<ShipmentResponse> {
    this.logger.log(`Booking shipment for order ${req.orderNumber} (${req.totalWeightKg}kg, ${req.parcelCount} parcels)`);

    if (this.sandbox || !this.apiUrl) {
      return this.mockBooking(req);
    }

    // Real provider integration — the actual payload shape depends on which provider
    // is selected (ADR-017). The structure below matches The Courier Guy's API convention
    // as a representative example; swap per the chosen provider's spec.
    const res = await fetch(`${this.apiUrl}/v1/shipments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        reference: req.orderNumber,
        recipient: {
          name: req.recipientName,
          phone: req.recipientPhone,
          email: req.recipientEmail,
          address1: req.addressLine1,
          address2: req.addressLine2,
          city: req.city,
          province: req.province,
          postalCode: req.postalCode,
        },
        weight: req.totalWeightKg,
        parcels: req.parcelCount,
        notes: req.notes,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Courier booking failed (${res.status}): ${body}`);
    }

    const data = await res.json() as {
      trackingNumber: string;
      bookingReference: string;
      estimatedDeliveryDays?: number;
    };

    return {
      trackingNumber: data.trackingNumber,
      courierProvider: process.env.COURIER_PROVIDER ?? "the-courier-guy",
      bookingReference: data.bookingReference,
      estimatedDeliveryDays: data.estimatedDeliveryDays ?? this.estimateDeliveryDays(req.province),
    };
  }

  // Track a shipment by tracking number. Returns the current status + event history.
  async trackShipment(trackingNumber: string): Promise<TrackingStatus> {
    this.logger.log(`Tracking shipment ${trackingNumber}`);

    if (this.sandbox || !this.apiUrl) {
      return this.mockTracking(trackingNumber);
    }

    const res = await fetch(`${this.apiUrl}/v1/shipments/${trackingNumber}/track`, {
      headers: { "Authorization": `Bearer ${this.apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Tracking lookup failed (${res.status}) for ${trackingNumber}`);
    }

    const data = await res.json() as {
      status: string;
      statusDescription: string;
      lastUpdate: string;
      events: TrackingEvent[];
    };

    return {
      trackingNumber,
      status: this.normalizeStatus(data.status),
      statusDescription: data.statusDescription,
      lastUpdate: new Date(data.lastUpdate),
      events: data.events ?? [],
    };
  }

  // Estimate delivery days based on province distance from KZN flagship yard.
  // Used when the provider doesn't return an estimate, and for sandbox mode.
  private estimateDeliveryDays(province: Province): number {
    const days: Record<Province, number> = {
      KWAZULU_NATAL: 2,
      GAUTENG: 3,
      MPUMALANGA: 3,
      EASTERN_CAPE: 4,
      LIMPOPO: 4,
      NORTH_WEST: 5,
      WESTERN_CAPE: 6,
    };
    return days[province] ?? 5;
  }

  private normalizeStatus(raw: string): TrackingStatus["status"] {
    const s = raw.toUpperCase().replace(/\s/g, "_");
    if (s.includes("DELIVER")) return "DELIVERED";
    if (s.includes("OUT_FOR")) return "OUT_FOR_DELIVERY";
    if (s.includes("TRANSIT") || s.includes("COLLECT")) return "IN_TRANSIT";
    if (s.includes("PENDING") || s.includes("BOOKED")) return "PENDING";
    if (s.includes("EXCEPTION") || s.includes("FAIL")) return "EXCEPTION";
    return "PENDING";
  }

  private mockBooking(req: ShipmentRequest): ShipmentResponse {
    const mockTracking = `TCG${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
    this.logger.warn(`Sandbox mode: mock tracking number ${mockTracking} for order ${req.orderNumber}`);
    return {
      trackingNumber: mockTracking,
      courierProvider: "sandbox",
      bookingReference: `BOOK-${req.orderNumber}`,
      estimatedDeliveryDays: this.estimateDeliveryDays(req.province),
    };
  }

  private mockTracking(trackingNumber: string): TrackingStatus {
    this.logger.warn(`Sandbox mode: mock tracking for ${trackingNumber}`);
    return {
      trackingNumber,
      status: "IN_TRANSIT",
      statusDescription: "Shipment in transit to destination",
      lastUpdate: new Date(),
      events: [
        {
          timestamp: new Date(Date.now() - 86400000),
          location: "Durban Depot",
          description: "Shipment collected from origin",
        },
        {
          timestamp: new Date(),
          location: "In Transit",
          description: "Shipment in transit to destination sorting facility",
        },
      ],
    };
  }
}
