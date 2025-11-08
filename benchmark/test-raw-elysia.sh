#!/bin/bash

# Benchmark Test Script for Raw Elysia.js
# Port: 3003

echo "🧪 Raw Elysia.js Benchmark Tests"
echo "=================================="
echo ""

BASE_URL="http://localhost:3003"

# Check if server is running
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo "❌ Server not running on $BASE_URL"
    echo "Start with: cd raw-elysia && bun run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Create output directory
mkdir -p result

# Test 1: Health Check (No Database)
echo "📊 Test 1: Health Check (Simple Response)"
echo "==========================================="
autocannon -c 100 -d 30 -p 10 "$BASE_URL/health" > result/raw-elysia-health.txt
echo "✅ Complete - Results saved to result/raw-elysia-health.txt"
echo ""

# Test 2: Database Read
echo "📊 Test 2: GET /users (Database Read)"
echo "======================================"
autocannon -c 50 -d 30 "$BASE_URL/users" > result/raw-elysia-users-read.txt
echo "✅ Complete - Results saved to result/raw-elysia-users-read.txt"
echo ""

echo "🎉 All Raw Elysia.js tests complete!"
echo "Results saved in benchmark/result/"
