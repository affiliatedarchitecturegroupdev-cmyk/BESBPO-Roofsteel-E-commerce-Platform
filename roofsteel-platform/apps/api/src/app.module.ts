import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ProductsModule } from "./products/products.module";
import { CategoriesModule } from "./categories/categories.module";
import { PricingModule } from "./pricing/pricing.module";
import { AuthModule } from "./auth/auth.module";
import { CartModule } from "./cart/cart.module";
import { OrdersModule } from "./orders/orders.module";
import { TradeAccountsModule } from "./trade-accounts/trade-accounts.module";

// All six modules below now have real logic, not empty scaffolds — see
// docs/DEVELOPMENT-LOG.md for the session that finalised auth/cart/orders/trade-accounts.
// What's still genuinely incomplete in each (real TODOs, not silent gaps) is marked with
// TODO comments in the relevant service/controller file, most commonly: resolving the
// authenticated account's real type instead of defaulting to RETAIL (blocked on a full
// session/JWT strategy — see guidelines/08-security-and-compliance.md), and the real
// third-party API calls in the three payment strategy classes (blocked on real gateway
// credentials being issued, not on anything in this codebase).
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProductsModule,
    CategoriesModule,
    PricingModule,
    AuthModule,
    CartModule,
    OrdersModule,
    TradeAccountsModule,
  ],
})
export class AppModule {}
