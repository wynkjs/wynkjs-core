import { Module } from "wynkjs";
import { SessionController } from "./session.controller";

@Module({
  controllers: [SessionController],
})
export class SessionModule {}
