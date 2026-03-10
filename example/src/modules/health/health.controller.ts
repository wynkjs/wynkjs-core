import { Controller, Get, Injectable } from "wynkjs";
import { HealthService } from "./health.service";

@Injectable()
@Controller("/health")
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get("/")
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get("/ping")
  ping() {
    return this.healthService.ping();
  }
}
