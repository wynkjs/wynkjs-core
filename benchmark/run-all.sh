#!/bin/bash

# Master Benchmark Script
# Runs all framework benchmarks with warmup

echo "🚀 WynkJS Framework Benchmark Suite"
echo "===================================="
echo ""
echo "Comparing: WynkJS vs Express.js vs NestJS vs Raw Elysia.js"
echo ""

# Create output directory
mkdir -p result

# Function to check if server is running
check_server() {
    local url=$1
    local name=$2
    
    if ! curl -s "$url" > /dev/null 2>&1; then
        echo "❌ $name not running on $url"
        return 1
    fi
    echo "✅ $name is running"
    return 0
}

# Check all servers are running
echo "🔍 Checking all servers..."
echo ""

check_server "http://localhost:3000/health" "WynkJS" || { echo "Start with: cd wynkjs && bun run src/index.ts"; exit 1; }
check_server "http://localhost:3001/health" "Express.js" || { echo "Start with: cd expressjs && npm start"; exit 1; }
check_server "http://localhost:3002/health" "NestJS" || { echo "Start with: cd nestjs && npm run start:prod"; exit 1; }
check_server "http://localhost:3003/health" "Raw Elysia.js" || { echo "Start with: cd raw-elysia && bun run index.ts"; exit 1; }

echo ""
echo "🔥 Warmup Phase (Results will be discarded)"
echo "============================================"
echo ""

# Warmup - 10 seconds each
echo "Warming up WynkJS..."
autocannon -c 10 -d 10 http://localhost:3000/health > /dev/null 2>&1

echo "Warming up Express.js..."
autocannon -c 10 -d 10 http://localhost:3001/health > /dev/null 2>&1

echo "Warming up NestJS..."
autocannon -c 10 -d 10 http://localhost:3002/health > /dev/null 2>&1

echo "Warming up Raw Elysia.js..."
autocannon -c 10 -d 10 http://localhost:3003/health > /dev/null 2>&1

echo "✅ Warmup complete"
echo ""
echo "⏳ Waiting 5 seconds before starting actual benchmarks..."
sleep 5
echo ""

# Run WynkJS Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🟢 Testing WynkJS (Bun Runtime)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cd wynkjs
chmod +x ../test-wynkjs.sh
../test-wynkjs.sh
cd ..
echo ""

# Run Express.js Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔵 Testing Express.js (Node.js Runtime)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cd expressjs
chmod +x ../test-expressjs.sh
../test-expressjs.sh
cd ..
echo ""

# Run NestJS Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔴 Testing NestJS (Node.js + Fastify)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cd nestjs
chmod +x ../test-nestjs.sh
../test-nestjs.sh
cd ..
echo ""

# Run Raw Elysia.js Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚡ Testing Raw Elysia.js (Bun + Elysia Only)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cd raw-elysia
chmod +x ../test-raw-elysia.sh
../test-raw-elysia.sh
cd ..
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ All Benchmarks Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Results saved in: benchmark/result/"
echo ""
echo "Next steps:"
echo "1. Run: ./analyze-results.sh"
echo "2. View comparison table"
echo "3. Document results for this release"
echo ""
