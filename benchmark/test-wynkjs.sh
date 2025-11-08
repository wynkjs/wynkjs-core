#!/bin/bash

# Benchmark Test Script for WynkJS
# Port: 3000

echo "🧪 WynkJS Benchmark Tests"
echo "=========================="
echo ""

BASE_URL="http://localhost:3000"

# Check if server is running
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo "❌ Server not running on $BASE_URL"
    echo "Start with: cd wynkjs && bun run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Create output directory
mkdir -p ../result

# Test 1: Health Check (No Database)
echo "📊 Test 1: Health Check (Simple Response)"
echo "==========================================="
autocannon -c 100 -d 30 -p 10 "$BASE_URL/health" > ../result/wynkjs-health.txt
echo "✅ Complete - Results saved to result/wynkjs-health.txt"
echo ""

# Test 2: GET /users (Database Read)
echo "📊 Test 2: GET /users (Database Read)"
echo "======================================"
autocannon -c 50 -d 30 -p 1 "$BASE_URL/users" > ../result/wynkjs-users-read.txt
echo "✅ Complete - Results saved to result/wynkjs-users-read.txt"
echo ""

echo "🎉 All WynkJS tests complete!"
echo "Results saved in benchmark/result/"
