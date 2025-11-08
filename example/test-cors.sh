#!/bin/bash

# CORS Testing Script for WynkJS Example
# Tests the new CORS module functionality

echo "🧪 Testing WynkJS CORS Functionality"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Test counter
PASS=0
FAIL=0

# Function to test CORS
test_cors() {
    local test_name="$1"
    local origin="$2"
    local expected="$3"
    
    echo "📝 Test: $test_name"
    echo "   Origin: ${origin:-"(none)"}"
    
    if [ -z "$origin" ]; then
        # Test without Origin header
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/users" 2>&1)
    else
        # Test with Origin header
        response=$(curl -s -w "\n%{http_code}" -H "Origin: $origin" -X GET "$BASE_URL/users" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "   HTTP Code: $http_code"
    
    if [ "$http_code" = "$expected" ]; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        ((PASS++))
    else
        echo -e "   ${RED}❌ FAILED${NC} (Expected: $expected, Got: $http_code)"
        ((FAIL++))
    fi
    echo ""
}

# Check if server is running
echo "🔍 Checking if server is running..."
if ! curl -s "$BASE_URL/users" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not running on $BASE_URL${NC}"
    echo "   Please start the server first: cd example && bun run dev"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Running CORS Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: No Origin header (should be allowed based on corsOptions)
test_cors "No Origin Header" "" "200"

# Test 2: Allowed origin
test_cors "Allowed Origin (https://yourdomain.com)" "https://yourdomain.com" "200"

# Test 3: Allowed origin (www subdomain)
test_cors "Allowed Origin (https://www.yourdomain.com)" "https://www.yourdomain.com" "200"

# Test 4: Allowed origin (app subdomain)
test_cors "Allowed Origin (https://app.yourdomain.com)" "https://app.yourdomain.com" "200"

# Test 5: Blocked origin
test_cors "Blocked Origin (https://evil.com)" "https://evil.com" "403"

# Test 6: Localhost (development mode allows it)
test_cors "Localhost Origin (dev mode)" "http://localhost:5173" "200"

# Test 7: Different domain
test_cors "Random Domain" "https://random-domain.com" "403"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing CORS Test Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test CORS test controller
echo "📝 Test: CORS Test Controller - GET"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/cors-test/" 2>&1)
http_code=$(echo "$response" | tail -n1)
echo "   HTTP Code: $http_code"
if [ "$http_code" = "200" ]; then
    echo -e "   ${GREEN}✅ PASSED${NC}"
    ((PASS++))
else
    echo -e "   ${RED}❌ FAILED${NC}"
    ((FAIL++))
fi
echo ""

echo "📝 Test: CORS Test Controller - POST with Origin"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Origin: https://yourdomain.com" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  "$BASE_URL/cors-test/" 2>&1)
http_code=$(echo "$response" | tail -n1)
echo "   HTTP Code: $http_code"
if [ "$http_code" = "200" ]; then
    echo -e "   ${GREEN}✅ PASSED${NC}"
    ((PASS++))
else
    echo -e "   ${RED}❌ FAILED${NC}"
    ((FAIL++))
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "Total Tests: $((PASS + FAIL))"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

# Test CORS preflight (OPTIONS request)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Testing CORS Preflight (OPTIONS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📝 Preflight request with allowed origin:"
curl -v -X OPTIONS "$BASE_URL/users" \
  -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  2>&1 | grep -E "(< HTTP|< access-control-|< vary)"

echo ""
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
