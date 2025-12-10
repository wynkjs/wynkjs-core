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

# Function to kill process on a specific port
kill_port() {
    local port=$1
    echo "🔍 Checking port $port..."
    
    # Find and kill process on the port (macOS compatible)
    local pid=$(lsof -ti:$port)
    
    if [ ! -z "$pid" ]; then
        echo "   ⚠️  Found process $pid on port $port, killing..."
        kill -9 $pid 2>/dev/null
        sleep 1
        echo "   ✅ Port $port cleared"
    else
        echo "   ✅ Port $port is free"
    fi
}

# Kill all ports that will be used
echo "🧹 Cleaning up ports..."
echo ""
kill_port 3000
kill_port 3001
kill_port 3002
kill_port 3003
echo ""

# Function to start server in background
start_server() {
    local dir=$1
    local command=$2
    local name=$3
    local port=$4
    
    echo "🚀 Starting $name on port $port..."
    # Use nohup to keep process running and redirect to log file
    cd "$dir"
    nohup $command > "../result/${name// /-}-server.log" 2>&1 &
    local pid=$!
    cd - > /dev/null
    echo "   Started with PID: $pid"
    sleep 3
}

# Function to check if server is running
check_server() {
    local url=$1
    local name=$2
    local max_attempts=15
    local attempt=1
    
    echo "⏳ Waiting for $name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "   ✅ $name is running on $url"
            return 0
        fi
        echo "   ... attempt $attempt/$max_attempts"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "   ❌ $name failed to start on $url"
    return 1
}

# Start all servers
echo "🎬 Starting all servers..."
echo ""

start_server "wynkjs" "bun run src/index.ts" "WynkJS" "3000"
start_server "expressjs" "npm start" "Express.js" "3001"
start_server "nestjs" "npm run start:prod" "NestJS" "3002"
start_server "raw-elysia" "bun run index.ts" "Raw Elysia.js" "3003"

echo ""
echo "🔍 Verifying all servers are running..."
echo ""

check_server "http://localhost:3000/health" "WynkJS" || exit 1
check_server "http://localhost:3001/health" "Express.js" || exit 1
check_server "http://localhost:3002/health" "NestJS" || exit 1
check_server "http://localhost:3003/health" "Raw Elysia.js" || echo "⚠️  Skipping Raw Elysia.js (failed to start)"

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
chmod +x ./test-wynkjs.sh
./test-wynkjs.sh
echo ""

# Run Express.js Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔵 Testing Express.js (Node.js Runtime)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
chmod +x ./test-expressjs.sh
./test-expressjs.sh
echo ""

# Run NestJS Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔴 Testing NestJS (Node.js + Fastify)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
chmod +x ./test-nestjs.sh
./test-nestjs.sh
echo ""

# Run Raw Elysia.js Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚡ Testing Raw Elysia.js (Bun + Elysia Only)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
chmod +x ./test-raw-elysia.sh
./test-raw-elysia.sh
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ All Benchmarks Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Results saved in: benchmark/result/"
echo ""

# Cleanup - kill all benchmark servers
echo "🧹 Cleaning up servers..."
kill_port 3000
kill_port 3001
kill_port 3002
kill_port 3003
echo ""

echo "Next steps:"
echo "1. Run: ./analyze-results.sh"
echo "2. View comparison table"
echo "3. Document results for this release"
echo ""
