import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ProductsModule } from "./products/products.module";
import { CategoriesModule } from "./categories/categories.module";
import { PricingModule } from "./pricing/pricing.module";
import { AuthModule } from "./auth/auth.module";
import { CartModule } from "./cart/cart.module";
import { OrdersModule } from "./orders/orders.module";
import { TradeAccountsModule } from "./trade-accounts/trade-accounts.module";
import { AddressesModule } from "./addresses/addresses.module";
import { QuotesModule } from "./quotes/quotes.module";
import { WishlistsModule } from "./wishlists/wishlists.module";
import { ComplianceModule } from "./compliance/compliance.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { AdminModule } from "./admin/admin.module";
import { InventoryModule } from "./inventory/inventory.module";

// All modules now have real logic, not empty scaffolds. The auth module provides JWT
// session issuance (task 2.1), guards (task 2.2), and the @CurrentAccount decorator that
// the products/cart/orders/trade-accounts controllers use for tier-correct pricing (task 2.3).
// The addresses, quotes, wishlists, compliance, and reviews modules (tasks 2.5–2.9) provide
// the CRUD endpoints the storefront and admin panel need. What's still genuinely incomplete
// in each (real TODOs, not silent gaps) is marked with TODO comments in the relevant
// service/controller file — most commonly the real third-party API calls in the payment
// strategy classes and the admin auth guard (Phase 4).
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global rate limiting — 300 requests per minute per IP (default). Payment webhooks are
    // exempt (they have their own signature verification). See guidelines/11-security-and-
    // compliance.md. The limits are generous enough for a storefront but block brute-force
    // attempts on auth and price-resolution endpoints.
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 300 },
    ]),
    ProductsModule,
    CategoriesModule,
    PricingModule,
    AuthModule,
    CartModule,
    OrdersModule,
    TradeAccountsModule,
    AddressesModule,
    QuotesModule,
    WishlistsModule,
    ComplianceModule,
    ReviewsModule,
    AdminModule,
    InventoryModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
