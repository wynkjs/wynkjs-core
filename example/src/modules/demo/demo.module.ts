import { Module } from "wynkjs";
import { DemoController } from "./demo.controller";
import { DemoService } from "./demo.service";
import { DemoRolesGuard } from "./demo.guard";
import { DemoLoggingInterceptor } from "./demo.interceptor";
import { DemoTransformPipe } from "./demo.pipe";

@Module({
  controllers: [DemoController],
  providers: [DemoService, DemoRolesGuard, DemoLoggingInterceptor, DemoTransformPipe],
})
export class DemoModule {}
