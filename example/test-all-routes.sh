#!/bin/bash

echo "=== Testing WynkJS HTTP Decorators with Params, Query, and Body ==="
echo ""

echo "1️⃣  POST with multiple params (:id1/:id2), body, and query:"
echo "   curl -X POST 'http://localhost:3000/users/abc/xyz?includePosts=true&includeComments=false' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"demo@demo1.com\",\"name\":\"John\"}'"
echo ""
curl -s -X POST "http://localhost:3000/users/abc/xyz?includePosts=true&includeComments=false" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@demo1.com","name":"John"}' | jq .
echo ""

echo "2️⃣  GET with single param (:id) and query:"
echo "   curl 'http://localhost:3000/users/testid?includePosts=false&includeComments=true'"
echo ""
curl -s "http://localhost:3000/users/testid?includePosts=false&includeComments=true" | jq .
echo ""

echo "3️⃣  PATCH with param (:id), body, and query:"
echo "   curl -X PATCH 'http://localhost:3000/users/user123?includePosts=true' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"name\":\"UpdatedName\",\"age\":30}'"
echo ""
curl -s -X PATCH "http://localhost:3000/users/user123?includePosts=true" \
  -H "Content-Type: application/json" \
  -d '{"name":"UpdatedName","age":30}' | jq .
echo ""

echo "4️⃣  GET list (no params):"
echo "   curl 'http://localhost:3000/users'"
echo ""
curl -s "http://localhost:3000/users" | jq .
echo ""

echo "5️⃣  Validation Error - Missing required email:"
echo "   curl -X POST 'http://localhost:3000/users/a/b' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{}'"
echo ""
curl -s -X POST "http://localhost:3000/users/a/b" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
echo ""

echo "6️⃣  Validation Error - Short param (min 2 chars):"
echo "   curl 'http://localhost:3000/users/a?includePosts=true'"
echo ""
curl -s "http://localhost:3000/users/a?includePosts=true" | jq .
echo ""

echo "✅ All tests complete!"
