import { Module } from "wynkjs";
import { FormattersController } from "./formatters.controller";

@Module({
  controllers: [FormattersController],
})
export class FormattersModule {}
