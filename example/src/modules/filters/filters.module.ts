import { Module } from "wynkjs";
import { FiltersController } from "./filters.controller";

@Module({
  controllers: [FiltersController],
})
export class FiltersModule {}
