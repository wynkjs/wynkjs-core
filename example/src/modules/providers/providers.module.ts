import { Module } from "wynkjs";
import { ProvidersController } from "./providers.controller";
import { OptionalService } from "./optional.service";

@Module({
  controllers: [ProvidersController],
  providers: [OptionalService],
})
export class ProvidersModule {}
