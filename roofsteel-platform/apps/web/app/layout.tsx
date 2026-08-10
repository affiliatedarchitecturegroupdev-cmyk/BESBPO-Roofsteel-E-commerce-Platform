// Root layout — brand tokens mirror the corporate site's Foundry system
// (Deep Slate / Molten Orange / Cool Steel / Off-White), not the blueprint's
// generic "corporate blue" palette. See guidelines/03-frontend.md.
import "./globals.css";
import { StoreHeader } from "../components/layout/StoreHeader";
import { MobileTabBar } from "../components/layout/MobileTabBar";

export const metadata = {
  title: "Roofsteel Store — Steel, Roofing & Structural Materials",
  description:
    "Shop the full Roofsteel catalogue — steel roofing, structural steel, reinforcing steel, timber, and more.",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

// TODO(Phase 2, auth): cartCount below is hardcoded — wire to real cart
// state once the cart module has a frontend data layer (guidelines/12
// -storefront-ux-and-ia.md's Cart section). StoreHeader/MobileTabBar are
// real components now, not scaffolds — this TODO is about the data feeding
// them, not the components themselves.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <StoreHeader cartCount={0} />
        <main id="main">{children}</main>
        <MobileTabBar cartCount={0} />
      </body>
    </html>
  );
}
