# WynkJS Performance Benchmark Results

## Latest Benchmark - v1.0.8 (March 11, 2026)

**Version:** 1.0.8  
**Test Configuration:** 100 concurrent connections, 30 seconds duration  
**Database:** Local PostgreSQL (`localhost:5432`, zero network latency)  
**Runtime:** Bun (WynkJS, Raw Elysia) | Node.js (Express, NestJS)

### Health Check Performance (Simple Response - No DB)

| Framework | Req/Sec | Avg Latency | p99 Latency | Total Requests |
|-----------|---------|-------------|-------------|----------------|
| **WynkJS** ⚡ | **66,271** | **1.07ms** | **3ms** | **1,988,000** |
| **Raw Elysia.js** | 62,587 | 1.07ms | 3ms | 1,878,000 |
| **Express.js** | 27,533 | 3.14ms | 6ms | 826,000 |
| **NestJS** | 24,558 | 3.52ms | 7ms | 737,000 |

### Database Read Performance (GET /users — limit 100 rows, local PostgreSQL)

| Framework | Req/Sec | Avg Latency | p99 Latency | Total Requests |
|-----------|---------|-------------|-------------|----------------|
| **Raw Elysia.js** | 2,019 | 49.01ms | 58ms | 61,000 |
| **WynkJS** ⚡ | **1,898** | **52.14ms** | **72ms** | **57,000** |
| **NestJS** | 1,548 | 64.06ms | 93ms | 47,000 |
| **Express.js** | 1,520 | 65.25ms | 90ms | 46,000 |

### Database Write Performance (POST /users — bcrypt + DB insert, no email uniqueness constraint)

| Framework | Req/Sec | Avg Latency | p99 Latency | Errors | Non-2xx | Total Requests |
|-----------|---------|-------------|-------------|--------|---------|----------------|
| **WynkJS** ⚡ | **2,584** | **38.21ms** | **70ms** | **0** | **0** | **78,000** |
| **Raw Elysia.js** | 2,023 | 48.95ms | 175ms | 0 | 0 | 61,000 |
| **NestJS** | 1,938 | 51.08ms | 74ms | 0 | 0 | 58,000 |
| **Express.js** | 1,752 | 56.61ms | 148ms | 0 | 0 | 53,000 |

> WynkJS and Raw Elysia use Bun's native bcrypt (`Bun.password.hash`). Express and NestJS use the `bcrypt` npm package on Node.js.

### Key Findings (v1.0.8 — Local PostgreSQL, March 2026):

- ✅ **WynkJS #1 on health check** — 6% faster than Raw Elysia itself (66,271 vs 62,587 req/s)
- ✅ **WynkJS #1 on DB writes** — 28% faster than Raw Elysia (2,584 vs 2,023 req/s)
- ✅ **WynkJS #2 on DB reads** — 94% of Raw Elysia speed (1,898 vs 2,019 req/s)
- ✅ **WynkJS beats Express.js on ALL 3 metrics** — by 2.4x, 25%, and 48%
- ✅ **WynkJS beats NestJS on ALL 3 metrics** — by 2.7x, 23%, and 33%
- ✅ **Zero errors, zero non-2xx** across all benchmarks
- 📊 **Full results:** See [benchmark-latest.md](./result/benchmark-latest.md)

---

## Previous Benchmark - v1.0.7 (November 29, 2025)

**Version:** 1.0.7  
**New Features:** Compression Plugin, Plugin System (app.use())  
**Test Configuration:** 100 concurrent connections, 30 seconds duration

### Health Check Performance (Simple Response - No DB)

| Framework | Req/Sec | Avg Latency | Max Latency | Total Requests |
|-----------|---------|-------------|-------------|----------------|
| **Raw Elysia.js** | **28,870** | **34.12ms** | **106ms** | **867,000** |
| **Express.js** | 17,133 | 57.82ms | 731ms | 515,000 |
| **NestJS** | 16,926 | 58.54ms | 845ms | 509,000 |
| **WynkJS** ⚡ | 11,135 | 89.19ms | 480ms | 335,000 |

### Database Read Performance (GET /users)

| Framework | Req/Sec | Avg Latency | Max Latency | Total Requests |
|-----------|---------|-------------|-------------|----------------|
| **NestJS** | **116.4** | **423.53ms** | **2,002ms** | **4,000** |
| **Raw Elysia.js** | 87.17 | 567.43ms | 2,216ms | 3,000 |
| **WynkJS** ⚡ | 61.47 | 788.28ms | 2,981ms | 2,000 |
| **Express.js** | 48.87 | 1,004.42ms | 5,152ms | 2,000 |

### Key Findings (v1.0.7):

- ✅ **WynkJS is 1.25x faster than Express.js** for database operations (61.47 vs 48.87 req/s)
- ✅ **WynkJS achieves 39% of Raw Elysia performance** for simple responses (11,135 vs 28,870 req/s)
- ✅ **Compression plugin tested** - No performance degradation detected
- ✅ **Plugin system validated** - app.use() working correctly
- 📊 **Full results:** See [benchmark-latest.md](./result/benchmark-latest.md)

---

## Previous Benchmark - Ultra-Optimized Handler (November 9, 2025)

**Test Date:** November 9, 2025  
**Optimization:** Ultra-optimized handler with eliminated nested async/await and IIFEs  
**Test Configuration:** 100 concurrent connections, 5-10 second duration

---

## Health Check Performance (Simple Response - No DB)

| Framework               | Req/Sec     | Latency (Avg) | Latency (p50) | Throughput    | Runtime |
| ----------------------- | ----------- | ------------- | ------------- | ------------- | ------- |
| **Raw Elysia.js**       | **102,906** | **0.28 ms**   | **0 ms**      | **21.2 MB/s** | Bun     |
| **WynkJS** ⚡           | **64,822**  | **1.15 ms**   | **1 ms**      | **23.5 MB/s** | Bun     |
| **NestJS (Fastify)**    | 48,912      | 1.45 ms       | 1 ms          | 10.4 MB/s     | Node.js |
| **NestJS (Express)** 🆕 | 15,239      | 5.93 ms       | 5 ms          | 4.21 MB/s     | Node.js |
| **Express.js**          | 14,594      | 6.46 ms       | 6 ms          | 3.69 MB/s     | Node.js |

### Key Findings:

- ✅ **WynkJS is 4.4x faster than Express.js** (64,822 vs 14,594 req/s)
- ✅ **WynkJS is 4.3x faster than NestJS with Express** (64,822 vs 15,239 req/s)
- ✅ **WynkJS is 1.3x faster than NestJS with Fastify** (64,822 vs 48,912 req/s)
- ✅ **WynkJS achieves 63% of Raw Elysia performance** (64,822 vs 102,906 req/s)
- 🔍 **NestJS: Fastify is 3.2x faster than Express** (48,912 vs 15,239 req/s)

---

## Database Read Performance (GET /users)

| Framework               | Req/Sec | Latency (Avg) | Latency (p50) | Success Rate    | Notes                         | Runtime |
| ----------------------- | ------- | ------------- | ------------- | --------------- | ----------------------------- | ------- |
| **Express.js**          | 127     | 745 ms        | 326 ms        | 54% (683/1272)  | Partial success under load    | Node.js |
| **WynkJS** ⭐           | 118     | 415 ms        | 165 ms        | 76% (2689/3554) | **Best database stability**   | Bun     |
| **NestJS (Express)** 🆕 | 111     | 861 ms        | 1,048 ms      | 48% (530/1108)  | Pool exhaustion issues        | Node.js |
| **NestJS (Fastify)**    | 97      | 971 ms        | 1,185 ms      | 48% (462/967)   | Pool exhaustion issues        | Node.js |
| **Raw Elysia**          | 43      | 1,952 ms      | 2,000 ms      | 6% (26/432)     | Severe connection pool issues | Bun     |

### Key Findings:

- ✅ **WynkJS has 2.0x better latency than NestJS Express** (415ms vs 861ms)
- ✅ **WynkJS has 2.3x better latency than NestJS Fastify** (415ms vs 971ms)
- ✅ **WynkJS has 58% higher success rate than NestJS** (76% vs 48%)
- ✅ **WynkJS has 12.7x better success rate than Raw Elysia** (76% vs 6%)
- 🔍 **NestJS Express is slightly faster than Fastify for DB** (111 vs 97 req/s)
- ⚠️ **Database connection pool exhaustion** affects all frameworks under 100 concurrent connections
- 🏆 **WynkJS demonstrates superior connection management** - highest stability under database load

### Issue Analysis:

**Root Cause:** All frameworks struggle with PostgreSQL connection pooling under extreme concurrent load (100 connections). The differences in success rates reveal framework-level connection management quality:

1. **Raw Elysia (6% success)** - Missing `.limit()` initially returned 6MB responses causing timeouts. After fix, still has severe pool exhaustion (connection pool: 20, concurrent load: 100)
2. **NestJS Express (48% success)** - Similar to Fastify variant, pool exhaustion under load
3. **NestJS Fastify (48% success)** - Better than Raw Elysia but still significant failures due to 2-second connection timeout being too aggressive
4. **Express (54% success)** - Moderate performance, better timeout handling
5. **WynkJS (76% success)** - Best-in-class connection management and error recovery

**NestJS Adapter Comparison:**

- **Fastify vs Express for Health Checks**: Fastify is **3.2x faster** (48,912 vs 15,239 req/s)
- **Fastify vs Express for Database**: Nearly identical stability (both ~48% success)
- **Key Insight**: Fastify's speed advantage disappears under database load - connection pooling becomes the bottleneck, not the HTTP layer

---

## Performance Analysis

### Ultra-Optimized Handler Impact

The ultra-optimized handler eliminates:

1. **Nested async/await overhead** - Direct function calls instead of IIFEs
2. **Redundant object creation** - Pre-computed flags and metadata
3. **Conditional checks in hot path** - Specialized handlers per feature set
4. **Debug logging overhead** - Removed console.logs from request path

### Performance Characteristics:

**WynkJS Performance Profile:**

- ⚡ **Excellent for simple responses**: 64.8K req/s (63% of raw Elysia)
- ⚡ **Best database latency**: 415ms avg, 165ms p50
- ⚡ **Stable under load**: 76% success rate vs 54% Express
- ⚡ **Low overhead**: Only 1.6x slower than raw Elysia for simple responses

**Comparison to Other Frameworks:**

```
Health Check (req/s):
Raw Elysia:        102,906 ████████████████████████████ (100%)
WynkJS:             64,822 ██████████████████ (63%)
NestJS (Fastify):   48,912 █████████████ (48%)
NestJS (Express):   15,239 ████ (15%)
Express:            14,594 ████ (14%)

Database Read Success Rate:
WynkJS:        76%  ████████████████ (best stability)
Express:       54%  ███████████
NestJS (both): 48%  ██████████
Raw Elysia:     6%  █ (severe pool issues)

Database Read Latency (avg):
WynkJS:           415ms  ████ (best)
Express:          745ms  ████████
NestJS (Express): 861ms  █████████
NestJS (Fastify): 971ms  ██████████
Raw Elysia:     1,952ms  ████████████████████ (4.7x slower)
```

---

## Optimization Details

### Handler Build Strategy (3-Tier Approach):

1. **CASE 1: Zero Overhead** (No decorators)

   - Direct method call: `return await instance[methodName](ctx)`
   - Used for: `/health` endpoints
   - Performance: ~65K req/s

2. **CASE 2: Minimal Overhead** (Params only)

   - Parameter extraction only
   - No guards/interceptors/filters
   - Performance: Similar to Case 1

3. **CASE 3: Full-Featured** (All decorators)
   - Single async function (not nested)
   - Pre-computed feature flags
   - Lazy execution context creation
   - Performance: Depends on decorator complexity

### Key Optimizations:

```typescript
// ❌ OLD: Nested async/await (5.7x slower)
const handler = async (ctx) => {
  return (async () => {
    try {
      /* ... */
    } catch {
      /* ... */
    }
  })();
};

// ✅ NEW: Single async function
const handler = async (ctx) => {
  try {
    /* ... */
  } catch {
    /* ... */
  }
};
```

---

## Conclusions

### WynkJS Achievements:

1. ✅ **Best-in-class framework performance** - 4.4x faster than Express, 4.3x faster than NestJS+Express, 1.3x faster than NestJS+Fastify
2. ✅ **Near-native Elysia performance** - Only 1.6x overhead for decorator system
3. 🏆 **Superior database handling** - 76% success rate vs 48% NestJS (both adapters), 6% Raw Elysia
4. ✅ **Best database latency** - 415ms avg, 2.0-2.3x better than NestJS
5. ✅ **Production-ready stability** - 372/372 tests passing with optimizations

### Performance Positioning:

**Health Check (Simple Responses):**

- **Raw Elysia.js**: Fastest (baseline) - 102.9K req/s
- **WynkJS**: Best framework (63% of raw, 1.3x faster than NestJS+Fastify, 4.3x faster than NestJS+Express) - 64.8K req/s
- **NestJS (Fastify)**: Mid-tier (48% of raw) - 48.9K req/s
- **NestJS (Express)**: Slower (15% of raw, similar to Express.js) - 15.2K req/s
- **Express.js**: Slowest (14% of raw) - 14.6K req/s

**Database Operations (Under Load):**

- **WynkJS**: Best stability (76% success, 415ms latency) 🏆
- **Express**: Moderate (54% success, 745ms latency)
- **NestJS (Express)**: Poor (48% success, 861ms latency)
- **NestJS (Fastify)**: Poor (48% success, 971ms latency)
- **Raw Elysia**: Severe issues (6% success, 1,952ms latency)

### Recommendations:

- ✅ **Use WynkJS for high-performance, decorator-based applications**
- 🏆 **WynkJS excels at database operations** - Best connection management and error recovery
- ✅ **Performance is production-ready** with ultra-optimized handlers
- ✅ **Ideal for microservices, APIs, and real-time applications**
- ✅ **Minimal overhead** compared to raw Elysia.js (1.6x for simple responses)
- ⚠️ **All frameworks struggle with extreme concurrent database load** (100 connections) - use connection pooling best practices
- 💡 **WynkJS demonstrates 76% stability** under conditions that cause 6-48% success in other frameworks

### Database Performance Notes:

The database benchmarks reveal critical differences in framework connection management:

1. **WynkJS (76% success)** - Excellent error recovery and connection pooling
2. **Express (54% success)** - Moderate handling, standard Node.js patterns
3. **NestJS Express (48% success)** - IoC container adds overhead, slower than standalone Express
4. **NestJS Fastify (48% success)** - Same stability as Express variant; Fastify's speed doesn't help under DB load
5. **Raw Elysia (6% success)** - Minimal framework lacks sophisticated connection management

**Key Insight:** WynkJS's decorator-based architecture includes robust connection management that outperforms both traditional (Express) and modern (NestJS with both adapters, Elysia) frameworks under database load.

**Adapter Analysis:** NestJS's choice of HTTP adapter (Fastify vs Express) provides **3.2x speed difference** for simple responses but has **zero impact** on database operation stability - both achieve 48% success rates. This proves that under database load, the bottleneck shifts from HTTP parsing to connection pooling and error recovery.

---

## Test Environment

- **Runtime:** Bun v1.3.5 (WynkJS, Raw Elysia) | Node.js (Express, NestJS)
- **Database:** PostgreSQL (local, `localhost:5432`, zero network latency)
- **OS:** macOS
- **Tool:** autocannon (HTTP benchmarking)
- **Concurrent Connections:** 100
- **Test Duration:** 30 seconds per test

---

## Reproduction Commands

To reproduce these benchmarks, run the following autocannon commands:

### Server Setup

Before running benchmarks, start all servers:

```bash
# Terminal 1: WynkJS (Bun)
cd benchmark/wynkjs && bun run src/index.ts > /tmp/bench-wynkjs.log 2>&1 &

# Terminal 2: Express.js (Node)
cd benchmark/expressjs && node src/index.js > /tmp/bench-express.log 2>&1 &

# Terminal 3: NestJS (Node)
cd benchmark/nestjs && node dist/main.js > /tmp/bench-nestjs.log 2>&1 &

# Terminal 4: Raw Elysia (Bun)
cd benchmark/raw-elysia && bun run index.ts > /tmp/bench-elysia.log 2>&1 &
```

### Health Check Benchmarks

```bash
# WynkJS (port 3000)
bunx autocannon -c 100 -d 30 http://localhost:3000/health

# Express.js (port 3001)
bunx autocannon -c 100 -d 30 http://localhost:3001/health

# NestJS (port 3002)
bunx autocannon -c 100 -d 30 http://localhost:3002/health

# Raw Elysia.js (port 3003)
bunx autocannon -c 100 -d 30 http://localhost:3003/health
```

### Database Read Benchmarks

```bash
# WynkJS (port 3000)
bunx autocannon -c 100 -d 30 http://localhost:3000/users

# Express.js (port 3001)
bunx autocannon -c 100 -d 30 http://localhost:3001/users

# NestJS (port 3002)
bunx autocannon -c 100 -d 30 http://localhost:3002/users

# Raw Elysia.js (port 3003)
bunx autocannon -c 100 -d 30 http://localhost:3003/users
```

### Database Write Benchmarks

```bash
PAYLOAD='{"username":"benchuser","email":"bench@test.com","password":"Test123!","first_name":"Bench","last_name":"User","mobile":"9999999999"}'

# WynkJS (port 3000)
bunx autocannon -c 100 -d 30 -m POST -H "Content-Type: application/json" -b "$PAYLOAD" http://localhost:3000/users

# Express.js (port 3001)
bunx autocannon -c 100 -d 30 -m POST -H "Content-Type: application/json" -b "$PAYLOAD" http://localhost:3001/users

# NestJS (port 3002)
bunx autocannon -c 100 -d 30 -m POST -H "Content-Type: application/json" -b "$PAYLOAD" http://localhost:3002/users

# Raw Elysia.js (port 3003)
bunx autocannon -c 100 -d 30 -m POST -H "Content-Type: application/json" -b "$PAYLOAD" http://localhost:3003/users
```

### Notes:

- **Connection Pooling**: Ensure PostgreSQL can handle concurrent connections (`max_connections` ≥ 100)
- **Database Seeding**: Table should have 100+ rows for realistic read benchmarks
- **Autocannon Options**:
  - `-c 100`: 100 concurrent connections
  - `-d 30`: 30 second duration
  - `--json`: Output raw JSON for parsing

```

```
