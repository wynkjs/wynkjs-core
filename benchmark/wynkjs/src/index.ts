import "dotenv/config";
import { WynkFactory } from "wynkjs";
import { DatabaseService } from "./database.service";
import { UserController } from "./user.controller";
import { HealthController } from "./health.controller";

const port = Number(process.env.PORT) || 3000;

const app = WynkFactory.create({
  providers: [DatabaseService],
  controllers: [HealthController, UserController],
  cors: true,
  logger: false,
});

await app.listen(port);

console.log(`WynkJS Benchmark Server running on http://localhost:${port}`);
