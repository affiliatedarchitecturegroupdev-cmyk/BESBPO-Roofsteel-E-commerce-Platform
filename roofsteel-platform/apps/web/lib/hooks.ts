"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import {
  productsApi,
  categoriesApi,
  cartApi,
  authApi,
  setTokens,
  clearTokens,
  getAccessToken,
  type CartWithPricing,
  type AuthResponse,
  type PaginatedResponse,
} from "./api-client";
import type { CategorySummary, ProductSummary, AccountType } from "@roofsteel/shared-types";

// --- Auth hook ---

export interface AuthState {
  accountId: string | null;
  email: string | null;
  name: string | null;
  type: AccountType | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    accountId: null,
    email: null,
    name: null,
    type: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, check if a token exists — the auth state is derived from the token's
    // presence, not decoded client-side (the server validates it on every request).
    const token = getAccessToken();
    setAuth((prev) => ({
      ...prev,
      isAuthenticated: !!token,
    }));
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setTokens(res.accessToken, res.refreshToken);
    setAuth({
      accountId: res.accountId,
      email: res.email,
      name: res.name,
      type: res.type,
      isAuthenticated: true,
    });
    return res;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, companyName?: string) => {
    const res = await authApi.register(email, password, name, companyName);
    setTokens(res.accessToken, res.refreshToken);
    setAuth({
      accountId: res.accountId,
      email: res.email,
      name: res.name,
      type: res.type,
      isAuthenticated: true,
    });
    return res;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAuth({
      accountId: null,
      email: null,
      name: null,
      type: null,
      isAuthenticated: false,
    });
  }, []);

  return { auth, loading, login, register, logout };
}

// --- Products hook ---

export function useProducts(params?: { category?: string; search?: string; page?: number; pageSize?: number }) {
  const [data, setData] = useState<PaginatedResponse<ProductSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsApi.list(params);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [params?.category, params?.search, params?.page, params?.pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { data, loading, error, refetch: fetchProducts };
}

// --- Categories hook ---

export function useCategories() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading, error };
}

// --- Cart context (shared across all components) ---

export interface CartContextValue {
  cart: CartWithPricing | null;
  loading: boolean;
  itemCount: number;
  guestId: string;
  addToCart: (productId: string, quantity: number, mtl?: unknown) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartWithPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestId] = useState(() => {
    // Persistent guest ID in localStorage — survives page reloads for unauthenticated users.
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("roofsteel_guest_id");
    if (!id) {
      id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("roofsteel_guest_id", id);
    }
    return id;
  });

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const result = await cartApi.get(guestId);
      setCart(result);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (productId: string, quantity: number, mtl?: unknown) => {
      await cartApi.addItem(productId, quantity, guestId, mtl);
      await refreshCart();
    },
    [guestId, refreshCart]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      await cartApi.updateItem(itemId, quantity);
      await refreshCart();
    },
    [refreshCart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      await cartApi.removeItem(itemId);
      await refreshCart();
    },
    [refreshCart]
  );

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{ cart, loading, itemCount, guestId, addToCart, updateQuantity, removeItem, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
