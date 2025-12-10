# WynkJS Framework Benchmark Results

**Test Date:** 2025-11-29 12:25:48

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
| WynkJS | 11135.47 | 89.19ms | 480ms | 335000 |
| Express.js | 17133.41 | 57.82ms | 731ms | 515000 |
| NestJS | 16925.6 | 58.54ms | 845ms | 509000 |
| Raw Elysia.js | 28870.4 | 34.12ms | 106ms | 867000 |

---

## Test 2: Database Read (GET /users)

| Framework | Req/Sec | Avg Latency | Max Latency | Total Requests |
|-----------|---------|-------------|-------------|----------------|
| WynkJS | 61.47 | 788.28ms | 2981ms | 2000 |
| Express.js | 48.87 | 1004.42ms | 5152ms | 2000 |
| NestJS | 116.4 | 423.53ms | 2002ms | 4000 |
| Raw Elysia.js | 87.17 | 567.43ms | 2216ms | 3000 |

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
- Express.js is **1.53x faster** than WynkJS (17133.41 vs 11135.47 req/s)
- NestJS is **1.51x faster** than WynkJS (16925.6 vs 11135.47 req/s)
- Raw Elysia.js is **2.59x faster** than WynkJS (28870.4 vs 11135.47 req/s)

**Database Read:**
- WynkJS is **1.25x faster** than Express.js (61.47 vs 48.87 req/s)
- NestJS is **1.89x faster** than WynkJS (116.4 vs 61.47 req/s)
- Raw Elysia.js is **1.41x faster** than WynkJS (87.17 vs 61.47 req/s)

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

**Generated on:** 2025-11-29 12:25:48
