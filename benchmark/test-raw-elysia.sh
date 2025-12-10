#!/bin/bash

# Benchmark Test Script for Raw Elysia.js
# Port: 3003

echo "🧪 Raw Elysia.js Benchmark Tests"
echo "=================================="
echo ""

BASE_URL="http://localhost:3003"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULT_DIR="$SCRIPT_DIR/result"

# Check if server is running
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo "❌ Server not running on $BASE_URL"
    echo "Start with: cd raw-elysia && bun run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Create output directory
mkdir -p "$RESULT_DIR"

# Test 1: Health Check (No Database)
echo "📊 Test 1: Health Check (Simple Response)"
echo "==========================================="
autocannon -c 100 -d 30 -p 10 "$BASE_URL/health" > "$RESULT_DIR/raw-elysia-health.txt" 2>&1
echo "✅ Complete - Results saved to result/raw-elysia-health.txt"
echo ""

# Test 2: Database Read
echo "📊 Test 2: GET /users (Database Read)"
echo "======================================"
autocannon -c 50 -d 30 "$BASE_URL/users" > "$RESULT_DIR/raw-elysia-users-read.txt" 2>&1
echo "✅ Complete - Results saved to result/raw-elysia-users-read.txt"
echo ""

echo "🎉 All Raw Elysia.js tests complete!"
echo "Results saved in benchmark/result/"
