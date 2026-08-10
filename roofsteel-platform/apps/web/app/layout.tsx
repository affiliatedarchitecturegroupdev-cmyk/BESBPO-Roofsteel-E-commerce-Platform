// Root layout — brand tokens mirror the corporate site's Foundry system
// (Deep Slate / Molten Orange / Cool Steel / Off-White), not the blueprint's
// generic "corporate blue" palette. See guidelines/03-frontend.md.
import "./globals.css";
import { StoreHeader } from "../components/layout/StoreHeader";
import { MobileTabBar } from "../components/layout/MobileTabBar";
import { CartProvider } from "../lib/hooks";

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

// CartProvider wraps the entire app so the cart context (item count, add-to-cart,
// quantity updates) is available from any component — the header badge, the cart
// drawer, the PDP's Add to Cart, and the /cart page all read from this one source.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <a className="skip-link" href="#main">Skip to content</a>
          <StoreHeader />
          <main id="main">{children}</main>
          <MobileTabBar />
        </CartProvider>
      </body>
    </html>
  );
}
