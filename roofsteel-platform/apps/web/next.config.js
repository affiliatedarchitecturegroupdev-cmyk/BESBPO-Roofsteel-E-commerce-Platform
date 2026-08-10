/** @type {import('next').NextConfig} */
// See guidelines/03-frontend.md — next/image is the mechanism ADR-002 relies
// on instead of a dedicated Rust image-optimisation service. remotePatterns
// below is a real, necessary config, not boilerplate: next/image refuses to
// optimise an external image host it doesn't know about, and ProductCard.tsx
// already uses next/image. Add the real product-photography CDN host here
// once one exists (see spec Section 3.5's "photography for 171 lines won't
// all exist day one" — this list will grow as real photos get sourced).
const nextConfig = {
  images: {
    remotePatterns: [
      // Placeholder — replace with the real product-photography host once
      // chosen. Left empty rather than guessing at a domain that doesn't
      // exist yet; ProductCard's missing-photo placeholder (guidelines/03)
      // covers every product until this is real.
    ],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
