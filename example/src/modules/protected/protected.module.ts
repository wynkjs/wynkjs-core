import { Module } from "wynkjs";
import { ProtectedRoutesController } from "./protected-routes.controller";

@Module({
  controllers: [ProtectedRoutesController],
})
export class ProtectedModule {}
