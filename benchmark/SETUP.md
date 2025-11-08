# Benchmark Setup Guide

Complete guide to set up and run the WynkJS benchmark suite comparing WynkJS vs Express.js vs NestJS.

## Prerequisites

### Required Software

1. **Bun** (for WynkJS)

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Node.js** (v18+ for Express.js and NestJS)

   ```bash
   # Using nvm
   nvm install 18
   nvm use 18
   ```

3. **PostgreSQL** (v14+)

   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   ```

4. **autocannon** (benchmarking tool)
   ```bash
   npm install -g autocannon
   ```

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE wynk_benchmark;

# Connect to the database
\c wynk_benchmark
```

### 2. Run Setup Script

```bash
# From the benchmark directory
psql -d wynk_benchmark -f setup-database.sql
```

This will:

- Create the `users` table
- Add indexes for performance
- Insert seed data (5 users)
- Set up triggers for `updated_at`

### 3. Verify Database

```bash
psql -d wynk_benchmark -c "SELECT * FROM users;"
```

You should see 5 seed users.

## Environment Configuration

### 1. WynkJS Setup

```bash
cd wynkjs

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/wynk_benchmark
# NODE_ENV=production
# PORT=3000

# Install dependencies
bun install
```

### 2. Express.js Setup

```bash
cd ../expressjs

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/wynk_benchmark
# NODE_ENV=production
# PORT=3001

# Install dependencies
npm install
```

### 3. NestJS Setup

```bash
cd ../nestjs

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/wynk_benchmark
# NODE_ENV=production
# PORT=3002

# Install dependencies
npm install

# Build for production
npm run build
```

## Running the Benchmarks

### Option 1: Manual (Step-by-Step)

#### 1. Start All Servers

**Terminal 1 - WynkJS:**

```bash
cd wynkjs
bun run src/index.ts
```

**Terminal 2 - Express.js:**

```bash
cd expressjs
npm start
```

**Terminal 3 - NestJS:**

```bash
cd nestjs
npm run start:prod
```

#### 2. Verify Servers

```bash
# Check WynkJS (should return {"status":"ok","timestamp":...})
curl http://localhost:3000/health

# Check Express.js
curl http://localhost:3001/health

# Check NestJS
curl http://localhost:3002/health
```

#### 3. Run Individual Benchmarks

```bash
# From benchmark directory

# Test WynkJS
cd wynkjs
chmod +x ../test-wynkjs.sh
../test-wynkjs.sh
cd ..

# Test Express.js
cd expressjs
chmod +x ../test-expressjs.sh
../test-expressjs.sh
cd ..

# Test NestJS
cd nestjs
chmod +x ../test-nestjs.sh
../test-nestjs.sh
cd ..
```

### Option 2: Automated (All at Once)

**Note:** This requires all servers to be running in separate terminals.

```bash
# From benchmark directory
chmod +x run-all.sh
./run-all.sh
```

This will:

1. ✅ Check all servers are running
2. 🔥 Run warmup phase (results discarded)
3. 📊 Run all benchmarks sequentially
4. 💾 Save results to `result/` directory

## Analyzing Results

### Generate Summary Report

```bash
chmod +x analyze-results.sh
./analyze-results.sh
```

This creates a markdown report at `result/benchmark-summary-YYYY-MM-DD.md` with:

- Comparison tables for all tests
- Performance ratios (how many times faster WynkJS is)
- Key findings and methodology

### View Raw Results

```bash
# View raw autocannon output
ls -lh result/

# View specific test
cat result/wynkjs-health.txt
cat result/expressjs-users-read.txt
cat result/nestjs-users-write.txt
```

## Understanding the Results

### Metrics Explained

- **Req/Sec:** Requests per second (higher is better)
- **Avg Latency:** Average response time (lower is better)
- **Max Latency:** Maximum response time (lower is better)
- **Total Requests:** Total requests completed in 30 seconds

### Test Scenarios

1. **Health Check** (`/health`)

   - Simple JSON response
   - No database operations
   - Tests raw framework performance

2. **Database Read** (`GET /users`)

   - SELECT all users from database
   - Tests database connection pooling and query performance

3. **Database Write** (`POST /users`)
   - Validates input (email, firstName, lastName)
   - Inserts new user into database
   - Tests validation + database write performance

### Expected Performance

Based on Elysia.js benchmarks (WynkJS uses Elysia under the hood):

| Test         | WynkJS      | Express.js | NestJS     | Ratio         |
| ------------ | ----------- | ---------- | ---------- | ------------- |
| Health Check | ~120k req/s | ~8k req/s  | ~12k req/s | 10-15x faster |
| DB Read      | ~35k req/s  | ~3k req/s  | ~5k req/s  | 7-12x faster  |
| DB Write     | ~25k req/s  | ~2k req/s  | ~4k req/s  | 6-12x faster  |

_Actual results may vary based on hardware and database performance._

## Troubleshooting

### Server Won't Start

**WynkJS:**

```bash
# Check Bun installation
bun --version

# Check for port conflicts
lsof -i :3000

# View detailed logs
cd wynkjs
bun run src/index.ts
```

**Express.js:**

```bash
# Check Node.js version
node --version

# Check for port conflicts
lsof -i :3001

# View detailed logs
cd expressjs
npm start
```

**NestJS:**

```bash
# Rebuild if needed
cd nestjs
npm run build
npm run start:prod
```

### Database Connection Errors

1. **Check PostgreSQL is running:**

   ```bash
   brew services list | grep postgresql
   ```

2. **Verify database exists:**

   ```bash
   psql -l | grep wynk_benchmark
   ```

3. **Test connection:**

   ```bash
   psql -d wynk_benchmark -c "SELECT COUNT(*) FROM users;"
   ```

4. **Check .env DATABASE_URL format:**
   ```
   postgresql://username:password@localhost:5432/wynk_benchmark
   ```

### Benchmark Errors

**autocannon not found:**

```bash
npm install -g autocannon
```

**Permission denied on scripts:**

```bash
chmod +x run-all.sh test-*.sh analyze-results.sh
```

**Server not responding:**

```bash
# Check if server is running
curl http://localhost:3000/health

# Restart server if needed
```

## Best Practices

### 1. Close Other Applications

For accurate benchmarks, close:

- Browsers with many tabs
- IDEs (VSCode, etc.)
- Other development servers
- Heavy background applications

### 2. Run Multiple Times

```bash
# Run benchmarks 3 times
./run-all.sh  # Run 1
./run-all.sh  # Run 2
./run-all.sh  # Run 3

# Compare results for consistency
```

### 3. Monitor System Resources

```bash
# Terminal 4 - Monitor CPU/Memory
top
# or
htop
```

### 4. Database Cleanup

After many benchmark runs:

```bash
# Clean up test data
psql -d wynk_benchmark -c "DELETE FROM users WHERE email = 'benchmark@test.com';"

# Reset sequence if needed
psql -d wynk_benchmark -c "SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));"
```



## CI/CD Integration (Future)

### GitHub Actions Example

```yaml
name: Benchmark

on:
  push:
    branches: [main]
    tags: ["v*"]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: wynk_benchmark
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install autocannon
        run: npm install -g autocannon

      - name: Setup Database
        run: |
          psql -h localhost -U postgres -d wynk_benchmark -f benchmark/setup-database.sql
        env:
          PGPASSWORD: postgres

      - name: Run Benchmarks
        run: |
          cd benchmark
          ./run-all.sh
          ./analyze-results.sh

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: benchmark/result/
```

## Next Steps

1. ✅ Install all prerequisites
2. ✅ Set up database
3. ✅ Configure environment files
4. ✅ Install dependencies for all projects
5. ✅ Run benchmarks
6. ✅ Analyze results
7. ✅ Document findings

## Resources

- [Elysia.js Benchmarks](https://elysiajs.com/at-glance.html#performance)
- [TechEmpower Benchmarks](https://www.techempower.com/benchmarks/)
- [autocannon Documentation](https://github.com/mcollina/autocannon)
- [Bun Documentation](https://bun.sh/docs)
- [WynkJS Documentation](../README.md)
