# WynkJS Framework Benchmark Results

**Test Date:** 2025-11-09 04:53:37

## Test Configuration

- **Tool:** autocannon
- **Connections:** 100 concurrent
- **Duration:** 30 seconds per test
- **Pipelining:** 10 requests per connection
- **Total Requests:** ~10,000+ per test

## Environment

- **OS:** macOS
- **Database:** PostgreSQL with Drizzle ORM
- **WynkJS:** Bun runtime
- **Express.js:** Node.js runtime
- **NestJS:** Node.js + Fastify adapter
- **Raw Elysia.js:** Bun runtime (minimal framework overhead)

---

## Test 1: Health Check (Simple Response - No Database)

| Framework | Req/Sec | Avg Latency | Max Latency | Total Requests |
|-----------|---------|-------------|-------------|----------------|
| WynkJS | 9319.17 | 106.69ms | 538ms | 281000 |
| Express.js | 16487.14 | 60.1ms | 1682ms | 496000 |
| NestJS | 18254.6 | 54.25ms | 1379ms | 549000 |
| Raw Elysia.js | 27549.2 | 35.79ms | 322ms | 827000 |

---

## Test 2: Database Read (GET /users)

| Framework | Req/Sec | Avg Latency | Max Latency | Total Requests |
|-----------|---------|-------------|-------------|----------------|
| WynkJS | 107.6 | 459.32ms | 2189ms | 3000 |
| Express.js | 97.54 | 507.82ms | 2003ms | 3000 |
| NestJS | 129.57 | 381.42ms | 1682ms | 4000 |
| Raw Elysia.js | 98.97 | 498.4ms | 2016ms | 3000 |

---

## Test 3: Database Write (POST /users with Validation)

| Framework | Req/Sec | Avg Latency | Max Latency | Total Requests |
|-----------|---------|-------------|-------------|----------------|
| WynkJS | N/A | N/A | N/A | N/A |
| Express.js | N/A | N/A | N/A | N/A |
| NestJS | N/A | N/A | N/A | N/A |
| Raw Elysia.js | N/A | N/A | N/A | N/A |

---

## Performance Summary

### Speed Comparison (Requests/Second)

**Health Check:**
- Express.js is **1.76x faster** than WynkJS (16487.14 vs 9319.17 req/s)
- NestJS is **1.95x faster** than WynkJS (18254.6 vs 9319.17 req/s)
- Raw Elysia.js is **2.95x faster** than WynkJS (27549.2 vs 9319.17 req/s)

**Database Read:**
- WynkJS is **1.10x faster** than Express.js (107.6 vs 97.54 req/s)
- NestJS is **1.20x faster** than WynkJS (129.57 vs 107.6 req/s)
- WynkJS is **1.08x faster** than Raw Elysia.js (107.6 vs 98.97 req/s)

**Database Write:**
- No data available (tests not implemented yet)

### Key Findings

- **Simple Response:** Performance varies across frameworks for simple health check endpoints
- **Database Operations:** Performance normalized when actual I/O operations are involved
- **Validation + Write:** Database write benchmarks provide insight into real-world CRUD performance

### Methodology

This benchmark follows industry-standard practices similar to [Elysia.js benchmarks](https://elysiajs.com/at-glance.html#performance) and [TechEmpower Framework Benchmarks](https://www.techempower.com/benchmarks/):

1. **Fair Comparison:** All frameworks use identical database schema, queries, and endpoints
2. **Production Mode:** Logging disabled, optimizations enabled
3. **Realistic Load:** 100 concurrent connections simulating real-world traffic
4. **Warmup Phase:** Initial runs discarded to account for JIT compilation
5. **Multiple Scenarios:** Tests simple responses, database reads, and database writes with validation

### Raw Results

Detailed autocannon output available in:
- `result/wynkjs-*.txt`
- `result/expressjs-*.txt`
- `result/nestjs-*.txt`
- `result/raw-elysia-*.txt`

---

**Generated on:** 2025-11-09 04:53:37
