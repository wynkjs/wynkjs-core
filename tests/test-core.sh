#!/bin/bash

# WynkJS Core Test Suite Runner
# This script runs only the verified, passing core tests
# Use this for regression testing when adding new features

echo "🧪 Running WynkJS Core Test Suite..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

bun test \
  tests/factory.test.ts \
  tests/cors.module.test.ts \
  tests/global-prefix.module.test.ts \
  tests/decorators/http.decorators.test.ts \
  tests/decorators/param.decorators.test.ts \
  tests/decorators/guard.decorators.simple.test.ts \
  tests/decorators/interceptor.decorators.simple.test.ts \
  tests/decorators/interceptor.advanced.test.ts \
  tests/decorators/pipe.decorators.simple.test.ts \
  tests/decorators/exception-filters.simple.test.ts

TEST_EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ All core tests passed!"
  echo "✨ Expected: ~240 tests passing (182 core + ~58 advanced interceptors)"
  echo "🎯 No regressions detected"
else
  echo "❌ Some tests failed!"
  echo "⚠️  Check output above for details"
  echo "💡 Compare with baseline: ~240 tests should pass"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $TEST_EXIT_CODE
