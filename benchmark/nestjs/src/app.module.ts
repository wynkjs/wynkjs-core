import { Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { UserController } from "./user.controller";
import { HealthController } from "./health.controller";

@Module({
  providers: [DatabaseService],
  controllers: [HealthController, UserController],
})
export class AppModule {}
