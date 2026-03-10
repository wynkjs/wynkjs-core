import { Module } from "wynkjs";
import { InterceptorsController } from "./interceptors.controller";

@Module({
  controllers: [InterceptorsController],
})
export class InterceptorsModule {}
