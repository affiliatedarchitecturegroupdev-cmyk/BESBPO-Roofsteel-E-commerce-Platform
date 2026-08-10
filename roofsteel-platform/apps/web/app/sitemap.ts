import type { MetadataRoute } from "next";

// Sitemap — static routes only. Product and category routes are generated dynamically
// from the catalogue, but we keep the static list here to avoid coupling the build to
// the API. For a full sitemap including all products, a future enhancement would fetch
// the product slugs at build/revalidate time.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://store.roofsteel.co.za";
  const lastModified = new Date();

  const staticRoutes = [
    "",
    "/products",
    "/cart",
    "/checkout",
    "/account",
    "/account/orders",
    "/account/addresses",
    "/account/wishlists",
    "/account/trade-account",
    "/account/settings",
    "/trade/apply",
    "/quote/request",
    "/login",
    "/register",
    "/terms",
    "/privacy",
    "/returns",
    "/shipping",
    "/faq",
  ];

  return staticRoutes.map((route) => ({
    url: `${base}${route}`,
    lastModified,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route.startsWith("/products") ? 0.9 : 0.6,
  }));
}
