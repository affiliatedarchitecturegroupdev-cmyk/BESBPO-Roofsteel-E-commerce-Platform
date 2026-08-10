// Typed API client for the Roofsteel NestJS API — ADR-009 (direct client-side fetch).
// Every client-side component that needs API data goes through this, not its own raw
// fetch() call. Auth tokens are attached automatically from localStorage.

import type {
  CategorySummary,
  ProductSummary,
  ProductDetail,
  ResolvedPrice,
  AccountType,
} from "@roofsteel/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

export interface AuthResponse {
  accountId: string;
  email: string;
  name: string;
  type: AccountType;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CartLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  mtlGaugeMm?: string;
  mtlProfile?: string;
  mtlColour?: string;
  mtlLengthMm?: number;
  pricing: ResolvedPrice;
  lineTotal: number;
  lineWeightKg: number;
  product: { name: string; unit: string; fulfilmentType: string; weightKgPerUnit: string };
}

export interface CartWithPricing {
  id: string;
  items: CartLine[];
  subtotal: number;
  totalWeightKg: number;
}

// --- Token management ---

const ACCESS_TOKEN_KEY = "roofsteel_access_token";
const REFRESH_TOKEN_KEY = "roofsteel_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// --- Core fetch wrapper ---

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // If 401 and we have a refresh token, try to refresh once and retry.
  if (res.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken && !options.headers?.["X-Retry"]) {
      const refreshed = await refreshTokens(refreshToken);
      if (refreshed) {
        return apiFetch<T>(path, {
          ...options,
          headers: { ...headers, "X-Retry": "true" },
        });
      }
    }
    clearTokens();
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `API error: ${res.status}`);
  }

  return res.json();
}

async function refreshTokens(refreshToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data: AuthResponse = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// --- Auth API ---

export const authApi = {
  register: (email: string, password: string, name: string, companyName?: string) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, companyName }),
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => clearTokens(),
};

// --- Products API ---

export const productsApi = {
  list: (params?: { category?: string; search?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    return apiFetch<PaginatedResponse<ProductSummary>>(`/products?${query}`);
  },

  getBySku: (sku: string) => apiFetch<ProductDetail>(`/products/${sku}`),
};

// --- Categories API ---

export const categoriesApi = {
  list: () => apiFetch<CategorySummary[]>("/categories"),
};

// --- Cart API ---

export const cartApi = {
  get: (guestId?: string) => {
    const query = guestId ? `?guestId=${guestId}` : "";
    return apiFetch<CartWithPricing>(`/cart${query}`);
  },

  addItem: (productId: string, quantity: number, guestId?: string, mtl?: unknown) => {
    const query = guestId ? `?guestId=${guestId}` : "";
    return apiFetch<CartLine>(`/cart/items${query}`, {
      method: "POST",
      body: JSON.stringify({ productId, quantity, mtl }),
    });
  },

  updateItem: (itemId: string, quantity: number) =>
    apiFetch<CartLine>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (itemId: string) =>
    apiFetch<{ removed: boolean }>(`/cart/items/${itemId}`, { method: "DELETE" }),

  merge: (guestId: string) =>
    apiFetch<CartWithPricing>("/cart/merge", {
      method: "POST",
      body: JSON.stringify({ guestId }),
    }),
};

// --- Addresses API ---

export interface AddressDto {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export const addressesApi = {
  list: () => apiFetch<AddressDto[]>("/addresses"),
  create: (data: Omit<AddressDto, "id">) =>
    apiFetch<AddressDto>("/addresses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AddressDto>) =>
    apiFetch<AddressDto>(`/addresses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<{ removed: boolean }>(`/addresses/${id}`, { method: "DELETE" }),
};

// --- Orders API ---

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  estimatedReadyDays: number;
  createdAt: string;
}

export const ordersApi = {
  getByOrderNumber: (orderNumber: string) =>
    apiFetch<unknown>(`/orders/${orderNumber}`),
};

// --- Trade Accounts API ---

export const tradeAccountsApi = {
  getMine: () => apiFetch<unknown>("/trade-accounts/me"),
  apply: (companyName: string, registrationNo?: string) =>
    apiFetch<unknown>("/trade-accounts/apply", {
      method: "POST",
      body: JSON.stringify({ companyName, registrationNo }),
    }),
};

// --- Reviews API ---

export const reviewsApi = {
  listByProduct: (sku: string, page = 1) =>
    apiFetch<PaginatedResponse<unknown>>(`/reviews/products/${sku}?page=${page}`),
  create: (sku: string, rating: number, body?: string) =>
    apiFetch<unknown>(`/reviews/products/${sku}`, {
      method: "POST",
      body: JSON.stringify({ rating, body }),
    }),
};

// --- Wishlists API ---

export const wishlistsApi = {
  list: () => apiFetch<unknown[]>("/wishlists"),
  create: (name: string, isPublic = false) =>
    apiFetch<unknown>("/wishlists", { method: "POST", body: JSON.stringify({ name, isPublic }) }),
  getById: (id: string) => apiFetch<unknown>(`/wishlists/${id}`),
  addItem: (wishlistId: string, productId: string) =>
    apiFetch<unknown>(`/wishlists/${wishlistId}/items`, {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),
  removeItem: (wishlistId: string, itemId: string) =>
    apiFetch<{ removed: boolean }>(`/wishlists/${wishlistId}/items/${itemId}`, {
      method: "DELETE",
    }),
};
