import { Module } from "wynkjs";
import { PipesController } from "./pipes.controller";

@Module({
  controllers: [PipesController],
})
export class PipesModule {}
