import { Injectable, Optional, Inject } from "wynkjs";
import { LOG_LEVEL } from "./config.token";

@Injectable()
export class OptionalService {
  private logLevel: string;

  constructor(@Optional() @Inject(LOG_LEVEL) logLevel?: string) {
    this.logLevel = logLevel ?? "info";
  }

  getLogLevel(): string {
    return this.logLevel;
  }
}
