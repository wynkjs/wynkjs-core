import "dotenv/config";
import { WynkFactory, compression } from "wynkjs";
import { DatabaseService } from "./database.service";
import { UserController } from "./user.controller";
import { HealthController } from "./health.controller";

const port = Number(process.env.PORT) || 3000;

console.log("🔧 Creating WynkJS application with DatabaseService provider...");

const app = WynkFactory.create({
  providers: [DatabaseService],
  controllers: [HealthController, UserController],
  cors: true,
  logger: false, // Disable logging for benchmark
});

// Add compression plugin (like NestJS/Elysia style)
app.use(
  compression({
    threshold: 1024, // Compress responses larger than 1KB
    encodings: ["gzip", "br", "deflate"], // Prefer gzip, then brotli, then deflate
  })
);

console.log("⏳ Starting server and initializing providers...");

await app.listen(port);

console.log(`🚀 WynkJS Benchmark Server running on http://localhost:${port}`);
console.log(`📊 Endpoints:`);
console.log(`   GET  http://localhost:${port}/health - Health check`);
console.log(`   GET  http://localhost:${port}/users - List all users`);
console.log(`   GET  http://localhost:${port}/users/:id - Get user by ID`);
console.log(`   POST http://localhost:${port}/users - Create user`);
