import type { MetadataRoute } from "next";

// robots.txt — allow all crawlers, point to the sitemap. The admin panel (/admin/*) and
// account pages (/account/*) are disallowed — they're behind auth and have no SEO value.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/checkout", "/cart"],
      },
    ],
    sitemap: "https://store.roofsteel.co.za/sitemap.xml",
  };
}
