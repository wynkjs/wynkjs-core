#!/bin/bash

# Benchmark Test Script for NestJS
# Port: 3002

echo "🧪 NestJS Benchmark Tests"
echo "=========================="
echo ""

BASE_URL="http://localhost:3002"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULT_DIR="$SCRIPT_DIR/result"

# Check if server is running
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo "❌ Server not running on $BASE_URL"
    echo "Start with: cd nestjs && npm run start:prod"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Create output directory
mkdir -p "$RESULT_DIR"

# Test 1: Health Check (No Database)
echo "📊 Test 1: Health Check (Simple Response)"
echo "==========================================="
autocannon -c 100 -d 30 -p 10 "$BASE_URL/health" > "$RESULT_DIR/nestjs-health.txt" 2>&1
echo "✅ Complete - Results saved to result/nestjs-health.txt"
echo ""

# Test 2: GET /users (Database Read)
echo "📊 Test 2: GET /users (Database Read)"
echo "======================================"
autocannon -c 50 -d 30 -p 1 "$BASE_URL/users" > "$RESULT_DIR/nestjs-users-read.txt" 2>&1
echo "✅ Complete - Results saved to result/nestjs-users-read.txt"
echo ""

echo "🎉 All NestJS tests complete!"
echo "Results saved in benchmark/result/"
