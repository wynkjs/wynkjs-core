import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const port = Number(process.env.PORT) || 3002;

  await app.listen(port, "0.0.0.0");

  console.log(
    `🚀 NestJS (Express) Benchmark Server running on http://localhost:${port}`
  );
  console.log(`📊 Endpoints:`);
  console.log(`   GET  http://localhost:${port}/health - Health check`);
  console.log(`   GET  http://localhost:${port}/users - List all users`);
  console.log(`   GET  http://localhost:${port}/users/:id - Get user by ID`);
  console.log(`   POST http://localhost:${port}/users - Create user`);
}

bootstrap();
