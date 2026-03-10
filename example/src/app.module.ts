import { Module } from "wynkjs";
import { UserModule } from "./modules/user/user.module";
import { ProductModule } from "./modules/product/product.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProtectedModule } from "./modules/protected/protected.module";
import { SessionModule } from "./modules/session/session.module";
import { DemoModule } from "./modules/demo/demo.module";
import { HealthModule } from "./modules/health/health.module";
import { FiltersModule } from "./modules/filters/filters.module";
import { ProvidersModule } from "./modules/providers/providers.module";

@Module({
  imports: [
    UserModule,
    ProductModule,
    AuthModule,
    ProtectedModule,
    SessionModule,
    DemoModule,
    HealthModule,
    FiltersModule,
    ProvidersModule,
  ],
})
export class AppModule {}
