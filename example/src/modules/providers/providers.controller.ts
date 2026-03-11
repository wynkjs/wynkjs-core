import { Controller, Get, Injectable, Inject } from "wynkjs";
import { APP_CONFIG, ASYNC_CONFIG, LOG_LEVEL } from "./config.token";
import { OptionalService } from "./optional.service";

@Injectable()
@Controller("/providers")
export class ProvidersController {
  constructor(
    @Inject(APP_CONFIG) private appConfig: Record<string, unknown>,
    @Inject(ASYNC_CONFIG) private asyncConfig: Record<string, unknown>,
    @Inject(LOG_LEVEL) private logLevel: string,
    private optionalService: OptionalService
  ) {}

  @Get("/")
  index() {
    return {
      feature: "ProvidersController — demonstrates all 4 provider patterns + @Optional + @Inject",
      routes: [
        "GET /providers/use-value — ValueProvider: static config via useValue",
        "GET /providers/use-factory — FactoryProvider: derived value via useFactory",
        "GET /providers/use-class — ClassProvider: explicit class registration via useClass",
        "GET /providers/use-existing — ExistingProvider: alias via useExisting",
        "GET /providers/optional — @Optional + @Inject: inject with fallback when token absent",
      ],
    };
  }

  @Get("/use-value")
  useValue() {
    return {
      feature: "ValueProvider — useValue: registers a static object under a token",
      provider: { provide: APP_CONFIG, useValue: "<static object>" },
      resolved: this.appConfig,
    };
  }

  @Get("/use-factory")
  useFactory() {
    return {
      feature: "FactoryProvider — useFactory: factory fn called at bootstrap, deps injected",
      provider: {
        provide: ASYNC_CONFIG,
        useFactory: "(appConfig) => ({ ...appConfig, extra: true })",
        inject: [APP_CONFIG],
      },
      resolved: this.asyncConfig,
    };
  }

  @Get("/use-class")
  useClass() {
    return {
      feature: "ClassProvider — useClass: maps a token to a class (DI resolves it)",
      note: "Registered in module providers as { provide: 'SomeToken', useClass: OptionalService }",
    };
  }

  @Get("/use-existing")
  useExisting() {
    return {
      feature: "ExistingProvider — useExisting: creates an alias pointing to an existing token",
      note: "Registered in factory providers as { provide: 'LogAlias', useExisting: LOG_LEVEL }",
    };
  }

  @Get("/optional")
  optional() {
    return {
      feature: "@Optional() + @Inject(token) — injects undefined instead of throwing when token missing",
      logLevel: this.optionalService.getLogLevel(),
    };
  }

  @Get("/log-level")
  logLevelRoute() {
    return {
      feature: "Direct @Inject(LOG_LEVEL) — string token resolved from useValue provider",
      logLevel: this.logLevel,
    };
  }
}
