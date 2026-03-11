import { Injectable, OnModuleInit, OnModuleDestroy } from "wynkjs";

@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
  private startTime: number = Date.now();
  private status: "starting" | "healthy" | "degraded" = "healthy";

  onModuleInit() {
    this.startTime = Date.now();
    this.status = "healthy";
    console.log("[HealthService] onModuleInit — service is ready");
  }

  onModuleDestroy() {
    this.status = "degraded";
    console.log("[HealthService] onModuleDestroy — service is shutting down");
  }

  getHealth() {
    return {
      status: this.status,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      framework: "WynkJS",
      runtime: "Bun",
    };
  }

  ping() {
    return { pong: true, ts: Date.now() };
  }
}
