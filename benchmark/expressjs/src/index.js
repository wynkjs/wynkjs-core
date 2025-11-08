import "dotenv/config";
import express from "express";
import bcrypt from "bcrypt";
import { initDatabase, getDb, closeDatabase } from "./database.js";
import { userTable } from "./schema.js";
import { createUserSchema, userIdSchema } from "./validation.js";
import { eq } from "drizzle-orm";

const app = express();
const port = Number(process.env.PORT) || 3001;

// Middleware
app.use(express.json());

// Disable logging for benchmark
app.disable('x-powered-by');

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
});

// Get all users
app.get("/users", async (req, res) => {
    try {
        const db = getDb();
        const users = await db.select().from(userTable).limit(100);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
app.get("/users/:id", async (req, res) => {
    try {
        const { id } = userIdSchema.parse({ id: req.params.id });
        const db = getDb();
        const users = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1);

        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(users[0]);
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: "Invalid UUID" });
        }
        res.status(500).json({ error: error.message });
    }
});

// Create user
app.post("/users", async (req, res) => {
    try {
        const data = createUserSchema.parse(req.body);

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(data.password || "password123", 4);  // Reduced for benchmarking

        const db = getDb();
        const result = await db.insert(userTable).values({
            ...data,
            password: hashedPassword,
        }).returning();
        res.status(201).json(result[0]);
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});// Graceful shutdown
process.on("SIGINT", async () => {
    await closeDatabase();
    process.exit(0);
});

// Initialize database and start server
await initDatabase();

app.listen(port, () => {
    console.log(`🚀 Express.js Benchmark Server running on http://localhost:${port}`);
    console.log(`📊 Endpoints:`);
    console.log(`   GET  http://localhost:${port}/health - Health check`);
    console.log(`   GET  http://localhost:${port}/users - List all users`);
    console.log(`   GET  http://localhost:${port}/users/:id - Get user by ID`);
    console.log(`   POST http://localhost:${port}/users - Create user`);
});
