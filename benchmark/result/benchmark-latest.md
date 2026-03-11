# WynkJS Framework Benchmark Results

**WynkJS Version:** v1.0.9  
**Test Date:** 2026-03-11  

## Test Configuration

- **Tool:** autocannon
- **Connections:** 100 concurrent
- **Duration:** 30 seconds per test
- **Total Requests:** Varies per framework

## Environment

- **OS:** macOS
- **Database:** PostgreSQL (local, `localhost:5432`, zero network latency)
- **WynkJS:** Bun runtime
- **Raw Elysia.js:** Bun runtime
- **Express.js:** Node.js runtime
- **NestJS:** Node.js runtime (Express adapter)

---

## Test 1: Health Check (Simple Response - No Database)

| Framework       | Req/Sec (avg) | Avg Latency | p99 Latency | Total Requests |
|-----------------|---------------|-------------|-------------|----------------|
| **WynkJS** ⚡   | **66,271**    | **1.07 ms** | **3 ms**    | **1,988,000**  |
| Raw Elysia.js   | 62,587        | 1.07 ms     | 3 ms        | 1,878,000      |
| Express.js      | 27,533        | 3.14 ms     | 6 ms        | 826,000        |
| NestJS          | 24,558        | 3.52 ms     | 7 ms        | 737,000        |

---

## Test 2: Database Read (GET /users — limit 100 rows, local PostgreSQL)

| Framework       | Req/Sec (avg) | Avg Latency | p99 Latency | Total Requests |
|-----------------|---------------|-------------|-------------|----------------|
| Raw Elysia.js   | 2,019         | 49.01 ms    | 58 ms       | 61,000         |
| **WynkJS** ⚡   | **1,898**     | **52.14 ms**| **72 ms**   | **57,000**     |
| NestJS          | 1,548         | 64.06 ms    | 93 ms       | 47,000         |
| Express.js      | 1,520         | 65.25 ms    | 90 ms       | 46,000         |

---

## Test 3: Database Write (POST /users — bcrypt hashing + DB insert)

> Configuration: email uniqueness constraint removed; default pg pool settings across all apps; zero errors, zero non-2xx.

| Framework       | Req/Sec (avg) | Avg Latency | p99 Latency | Errors | Non-2xx | Total Requests |
|-----------------|---------------|-------------|-------------|--------|---------|----------------|
| **WynkJS** ⚡   | **2,584**     | **38.21 ms**| **70 ms**   | **0**  | **0**   | **78,000**     |
| Raw Elysia.js   | 2,023         | 48.95 ms    | 175 ms      | 0      | 0       | 61,000         |
| NestJS          | 1,938         | 51.08 ms    | 74 ms       | 0      | 0       | 58,000         |
| Express.js      | 1,752         | 56.61 ms    | 148 ms      | 0      | 0       | 53,000         |

> WynkJS and Raw Elysia use Bun's native `Bun.password.hash` (bcrypt cost 4). Express and NestJS use the `bcrypt` npm package on Node.js.

---

## Performance Summary

### Health Check

```text
WynkJS:        66,271 req/s ████████████████████████████ (106%)
Raw Elysia:    62,587 req/s ██████████████████████████ (100%)
Express.js:    27,533 req/s ████████████ (44%)
NestJS:        24,558 req/s ██████████ (39%)
```

- ✅ **WynkJS #1 for simple responses** — 6% faster than Raw Elysia itself
- ✅ **WynkJS is 2.4x faster than Express.js** (66,271 vs 27,533 req/s)
- ✅ **WynkJS is 2.7x faster than NestJS** (66,271 vs 24,558 req/s)

### Database Read (Local PostgreSQL)

```text
Raw Elysia:  2,019 req/s ████████████████████████████ (100%)
WynkJS:      1,898 req/s ██████████████████████████ (94%)
NestJS:      1,548 req/s █████████████████████ (77%)
Express.js:  1,520 req/s █████████████████████ (75%)
```

- ✅ **WynkJS is 94% of Raw Elysia speed** on DB reads
- ✅ **WynkJS is 25% faster than Express.js** on DB reads (1,898 vs 1,520 req/s)
- ✅ **WynkJS is 23% faster than NestJS** on DB reads (1,898 vs 1,548 req/s)

### Database Write (POST /users)

```text
WynkJS:      2,584 req/s ████████████████████████████ (128%)
Raw Elysia:  2,023 req/s ██████████████████████ (100%)
NestJS:      1,938 req/s █████████████████████ (96%)
Express.js:  1,752 req/s ███████████████████ (87%)
```

- ✅ **WynkJS #1 for DB writes** — 28% faster than Raw Elysia (2,584 vs 2,023 req/s)
- ✅ **WynkJS is 48% faster than Express.js** on writes (2,584 vs 1,752 req/s)
- ✅ **WynkJS is 33% faster than NestJS** on writes (2,584 vs 1,938 req/s)
- ✅ **Zero errors, zero non-2xx** — clean benchmark

### Key Findings (v1.0.9 — Local PostgreSQL, March 2026)

1. ✅ **WynkJS beats Raw Elysia on health check AND writes** — decorator system adds zero meaningful overhead in CASE 1 and CASE 2
2. ✅ **WynkJS #1 across 2 of 3 test categories** — simple responses and DB writes
3. ✅ **WynkJS is #2 on DB reads** at 94% of Raw Elysia — only 121 req/s behind
4. ✅ **WynkJS beats Express.js on ALL 3 metrics** by 2.4x, 25%, and 48% respectively
5. ✅ **WynkJS beats NestJS on ALL 3 metrics** by 2.7x, 23%, and 33% respectively
6. ✅ **Zero errors across all benchmarks**

### Optimizations Applied (March 2026)

1. **Removed per-request `new Request(ctx)` / `new Response(ctx)` allocation** — wrapper objects now only created when `@Req()` / `@Res()` param decorator is actually present
2. **Fixed compression plugin** — `zlib` and `promisify` imported at module load time, not via dynamic `await import()` inside every request
3. **Removed expensive `count()` query from GET /users** — `SELECT count(*) FROM user_benchmark` on 1.5M+ rows ran on every request; replaced with `hasNext` derived from result length

### Methodology

1. **Fair Comparison:** All frameworks use identical database schema, queries (Drizzle ORM), and endpoints
2. **Local Database:** PostgreSQL on `localhost:5432` — zero network latency
3. **Production Mode:** Logging disabled, optimizations enabled
4. **Realistic Load:** 100 concurrent connections, 30-second sustained runs
5. **Multiple Scenarios:** Simple responses, DB reads (limit 100), and DB writes with bcrypt + validation
6. **Fresh processes:** All servers restarted before each benchmark suite

---

**Generated on:** 2026-03-11
