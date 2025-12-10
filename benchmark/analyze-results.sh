#!/bin/bash

# Result Analysis Script
# Parses autocannon output and generates comparison tables

echo "📊 Benchmark Results Analysis"
echo "=============================="
echo ""

RESULT_DIR="result"
OUTPUT_FILE="$RESULT_DIR/benchmark-summary-$(date +%Y-%m-%d).md"

# Check if result files exist
if [ ! -d "$RESULT_DIR" ] || [ -z "$(ls -A $RESULT_DIR/*.txt 2>/dev/null)" ]; then
    echo "❌ No benchmark results found in $RESULT_DIR/"
    echo "Run ./run-all.sh first to generate results"
    exit 1
fi

# Function to extract metrics from autocannon output
extract_metric() {
    local file=$1
    local metric=$2
    
    if [ ! -f "$file" ]; then
        echo "N/A"
        return
    fi
    
    case $metric in
        "req_sec")
            # Extract Avg from Req/Sec row (field 7 when split by │)
            grep "│ Req/Sec" "$file" | awk -F'│' '{print $7}' | tr -d ' ,'
            ;;
        "latency_avg")
            # Extract Avg from Latency row (field 7 when split by │)
            grep "│ Latency" "$file" | head -n 1 | awk -F'│' '{print $7}' | tr -d ' '
            ;;
        "latency_max")
            # Extract Max from Latency row (field 9 when split by │)
            grep "│ Latency" "$file" | head -n 1 | awk -F'│' '{print $9}' | tr -d ' '
            ;;
        "total_req")
            # Extract total requests from summary line (e.g., "399k requests")
            grep "requests in" "$file" | awk '{gsub(/k/, "000"); gsub(/m/, "000000"); print $1}'
            ;;
        "total_bytes")
            # Extract total bytes from summary line
            grep "requests in" "$file" | awk '{print $5 " " $6}'
            ;;
    esac
}

# Generate markdown report
cat > "$OUTPUT_FILE" << 'EOF'
# WynkJS Framework Benchmark Results

**Test Date:** $(date +"%Y-%m-%d %H:%M:%S")

## Test Configuration

- **Tool:** autocannon
- **Connections:** 100 concurrent
- **Duration:** 30 seconds per test
- **Pipelining:** 10 requests per connection
- **Total Requests:** ~10,000+ per test

## Environment

- **OS:** macOS
- **Database:** PostgreSQL with Drizzle ORM
- **WynkJS:** Bun runtime
- **Express.js:** Node.js runtime
- **NestJS:** Node.js + Fastify adapter
- **Raw Elysia.js:** Bun runtime (minimal framework overhead)

---

## Test 1: Health Check (Simple Response - No Database)

| Framework | Req/Sec | Avg Latency | Max Latency | Total Requests |
|-----------|---------|-------------|-------------|----------------|
EOF

# Extract health check metrics
echo "| WynkJS | $(extract_metric "$RESULT_DIR/wynkjs-health.txt" "req_sec") | $(extract_metric "$RESULT_DIR/wynkjs-health.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/wynkjs-health.txt" "latency_max") | $(extract_metric "$RESULT_DIR/wynkjs-health.txt" "total_req") |" >> "$OUTPUT_FILE"
echo "| Express.js | $(extract_metric "$RESULT_DIR/expressjs-health.txt" "req_sec") | $(extract_metric "$RESULT_DIR/expressjs-health.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/expressjs-health.txt" "latency_max") | $(extract_metric "$RESULT_DIR/expressjs-health.txt" "total_req") |" >> "$OUTPUT_FILE"
echo "| NestJS | $(extract_metric "$RESULT_DIR/nestjs-health.txt" "req_sec") | $(extract_metric "$RESULT_DIR/nestjs-health.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/nestjs-health.txt" "latency_max") | $(extract_metric "$RESULT_DIR/nestjs-health.txt" "total_req") |" >> "$OUTPUT_FILE"
echo "| Raw Elysia.js | $(extract_metric "$RESULT_DIR/raw-elysia-health.txt" "req_sec") | $(extract_metric "$RESULT_DIR/raw-elysia-health.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/raw-elysia-health.txt" "latency_max") | $(extract_metric "$RESULT_DIR/raw-elysia-health.txt" "total_req") |" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << 'EOF'

---

## Test 2: Database Read (GET /users)

| Framework | Req/Sec | Avg Latency | Max Latency | Total Requests |
|-----------|---------|-------------|-------------|----------------|
EOF

# Extract database read metrics
echo "| WynkJS | $(extract_metric "$RESULT_DIR/wynkjs-users-read.txt" "req_sec") | $(extract_metric "$RESULT_DIR/wynkjs-users-read.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/wynkjs-users-read.txt" "latency_max") | $(extract_metric "$RESULT_DIR/wynkjs-users-read.txt" "total_req") |" >> "$OUTPUT_FILE"
echo "| Express.js | $(extract_metric "$RESULT_DIR/expressjs-users-read.txt" "req_sec") | $(extract_metric "$RESULT_DIR/expressjs-users-read.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/expressjs-users-read.txt" "latency_max") | $(extract_metric "$RESULT_DIR/expressjs-users-read.txt" "total_req") |" >> "$OUTPUT_FILE"
echo "| NestJS | $(extract_metric "$RESULT_DIR/nestjs-users-read.txt" "req_sec") | $(extract_metric "$RESULT_DIR/nestjs-users-read.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/nestjs-users-read.txt" "latency_max") | $(extract_metric "$RESULT_DIR/nestjs-users-read.txt" "total_req") |" >> "$OUTPUT_FILE"
echo "| Raw Elysia.js | $(extract_metric "$RESULT_DIR/raw-elysia-users-read.txt" "req_sec") | $(extract_metric "$RESULT_DIR/raw-elysia-users-read.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/raw-elysia-users-read.txt" "latency_max") | $(extract_metric "$RESULT_DIR/raw-elysia-users-read.txt" "total_req") |" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << 'EOF'

---

## Test 3: Database Write (POST /users with Validation)

| Framework | Req/Sec | Avg Latency | Max Latency | Total Requests |
|-----------|---------|-------------|-------------|----------------|
EOF

# Extract database write metrics
echo "| WynkJS | $(extract_metric "$RESULT_DIR/wynkjs-users-write.txt" "req_sec") | $(extract_metric "$RESULT_DIR/wynkjs-users-write.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/wynkjs-users-write.txt" "latency_max") | $(extract_metric "$RESULT_DIR/wynkjs-users-write.txt" "total_req") |" >> "$OUTPUT_FILE"
echo "| Express.js | $(extract_metric "$RESULT_DIR/expressjs-users-write.txt" "req_sec") | $(extract_metric "$RESULT_DIR/expressjs-users-write.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/expressjs-users-write.txt" "latency_max") | $(extract_metric "$RESULT_DIR/expressjs-users-write.txt" "total_req") |" >> "$OUTPUT_FILE"
echo "| NestJS | $(extract_metric "$RESULT_DIR/nestjs-users-write.txt" "req_sec") | $(extract_metric "$RESULT_DIR/nestjs-users-write.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/nestjs-users-write.txt" "latency_max") | $(extract_metric "$RESULT_DIR/nestjs-users-write.txt" "total_req") |" >> "$OUTPUT_FILE"
echo "| Raw Elysia.js | $(extract_metric "$RESULT_DIR/raw-elysia-users-write.txt" "req_sec") | $(extract_metric "$RESULT_DIR/raw-elysia-users-write.txt" "latency_avg") | $(extract_metric "$RESULT_DIR/raw-elysia-users-write.txt" "latency_max") | $(extract_metric "$RESULT_DIR/raw-elysia-users-write.txt" "total_req") |" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << 'EOF'

---

## Performance Summary

EOF

# Extract metrics for calculations
WYNK_HEALTH=$(extract_metric "$RESULT_DIR/wynkjs-health.txt" "req_sec")
EXPRESS_HEALTH=$(extract_metric "$RESULT_DIR/expressjs-health.txt" "req_sec")
NEST_HEALTH=$(extract_metric "$RESULT_DIR/nestjs-health.txt" "req_sec")
ELYSIA_HEALTH=$(extract_metric "$RESULT_DIR/raw-elysia-health.txt" "req_sec")

WYNK_READ=$(extract_metric "$RESULT_DIR/wynkjs-users-read.txt" "req_sec")
EXPRESS_READ=$(extract_metric "$RESULT_DIR/expressjs-users-read.txt" "req_sec")
NEST_READ=$(extract_metric "$RESULT_DIR/nestjs-users-read.txt" "req_sec")
ELYSIA_READ=$(extract_metric "$RESULT_DIR/raw-elysia-users-read.txt" "req_sec")

WYNK_WRITE=$(extract_metric "$RESULT_DIR/wynkjs-users-write.txt" "req_sec")
EXPRESS_WRITE=$(extract_metric "$RESULT_DIR/expressjs-users-write.txt" "req_sec")
NEST_WRITE=$(extract_metric "$RESULT_DIR/nestjs-users-write.txt" "req_sec")
ELYSIA_WRITE=$(extract_metric "$RESULT_DIR/raw-elysia-users-write.txt" "req_sec")

# Function to calculate speed ratio
calc_ratio() {
    local val1=$1
    local val2=$2
    
    if [ "$val1" = "N/A" ] || [ "$val2" = "N/A" ] || [ -z "$val1" ] || [ -z "$val2" ]; then
        echo "N/A"
        return
    fi
    
    # Use bc for floating point calculation
    echo "scale=2; $val1 / $val2" | bc
}

# Calculate ratios for health check
if [ "$WYNK_HEALTH" != "N/A" ] && [ "$EXPRESS_HEALTH" != "N/A" ]; then
    WYNK_VS_EXPRESS_HEALTH=$(calc_ratio "$WYNK_HEALTH" "$EXPRESS_HEALTH")
    EXPRESS_VS_WYNK_HEALTH=$(calc_ratio "$EXPRESS_HEALTH" "$WYNK_HEALTH")
else
    WYNK_VS_EXPRESS_HEALTH="N/A"
    EXPRESS_VS_WYNK_HEALTH="N/A"
fi

if [ "$WYNK_HEALTH" != "N/A" ] && [ "$NEST_HEALTH" != "N/A" ]; then
    WYNK_VS_NEST_HEALTH=$(calc_ratio "$WYNK_HEALTH" "$NEST_HEALTH")
    NEST_VS_WYNK_HEALTH=$(calc_ratio "$NEST_HEALTH" "$WYNK_HEALTH")
else
    WYNK_VS_NEST_HEALTH="N/A"
    NEST_VS_WYNK_HEALTH="N/A"
fi

# Calculate ratios for database read
if [ "$WYNK_READ" != "N/A" ] && [ "$EXPRESS_READ" != "N/A" ]; then
    WYNK_VS_EXPRESS_READ=$(calc_ratio "$WYNK_READ" "$EXPRESS_READ")
    EXPRESS_VS_WYNK_READ=$(calc_ratio "$EXPRESS_READ" "$WYNK_READ")
else
    WYNK_VS_EXPRESS_READ="N/A"
    EXPRESS_VS_WYNK_READ="N/A"
fi

if [ "$WYNK_READ" != "N/A" ] && [ "$NEST_READ" != "N/A" ]; then
    WYNK_VS_NEST_READ=$(calc_ratio "$WYNK_READ" "$NEST_READ")
    NEST_VS_WYNK_READ=$(calc_ratio "$NEST_READ" "$WYNK_READ")
else
    WYNK_VS_NEST_READ="N/A"
    NEST_VS_WYNK_READ="N/A"
fi

# Generate comparison section
cat >> "$OUTPUT_FILE" << EOF
### Speed Comparison (Requests/Second)

**Health Check:**
EOF

if [ "$WYNK_VS_EXPRESS_HEALTH" != "N/A" ]; then
    # Check which is faster
    FASTER=$(echo "$WYNK_VS_EXPRESS_HEALTH > 1" | bc)
    if [ "$FASTER" -eq 1 ]; then
        echo "- WynkJS is **${WYNK_VS_EXPRESS_HEALTH}x faster** than Express.js ($WYNK_HEALTH vs $EXPRESS_HEALTH req/s)" >> "$OUTPUT_FILE"
    else
        echo "- Express.js is **${EXPRESS_VS_WYNK_HEALTH}x faster** than WynkJS ($EXPRESS_HEALTH vs $WYNK_HEALTH req/s)" >> "$OUTPUT_FILE"
    fi
else
    echo "- No data available for WynkJS vs Express.js comparison" >> "$OUTPUT_FILE"
fi

if [ "$WYNK_VS_NEST_HEALTH" != "N/A" ]; then
    FASTER=$(echo "$WYNK_VS_NEST_HEALTH > 1" | bc)
    if [ "$FASTER" -eq 1 ]; then
        echo "- WynkJS is **${WYNK_VS_NEST_HEALTH}x faster** than NestJS ($WYNK_HEALTH vs $NEST_HEALTH req/s)" >> "$OUTPUT_FILE"
    else
        echo "- NestJS is **${NEST_VS_WYNK_HEALTH}x faster** than WynkJS ($NEST_HEALTH vs $WYNK_HEALTH req/s)" >> "$OUTPUT_FILE"
    fi
else
    echo "- No data available for WynkJS vs NestJS comparison" >> "$OUTPUT_FILE"
fi

if [ "$ELYSIA_HEALTH" != "N/A" ] && [ ! -z "$ELYSIA_HEALTH" ]; then
    if [ "$WYNK_HEALTH" != "N/A" ] && [ ! -z "$WYNK_HEALTH" ]; then
        WYNK_VS_ELYSIA_HEALTH=$(calc_ratio "$WYNK_HEALTH" "$ELYSIA_HEALTH")
        ELYSIA_VS_WYNK_HEALTH=$(calc_ratio "$ELYSIA_HEALTH" "$WYNK_HEALTH")
        
        FASTER=$(echo "$WYNK_VS_ELYSIA_HEALTH > 1" | bc)
        if [ "$FASTER" -eq 1 ]; then
            echo "- WynkJS is **${WYNK_VS_ELYSIA_HEALTH}x faster** than Raw Elysia.js ($WYNK_HEALTH vs $ELYSIA_HEALTH req/s)" >> "$OUTPUT_FILE"
        else
            echo "- Raw Elysia.js is **${ELYSIA_VS_WYNK_HEALTH}x faster** than WynkJS ($ELYSIA_HEALTH vs $WYNK_HEALTH req/s)" >> "$OUTPUT_FILE"
        fi
    fi
fi

cat >> "$OUTPUT_FILE" << EOF

**Database Read:**
EOF

if [ "$WYNK_VS_EXPRESS_READ" != "N/A" ]; then
    FASTER=$(echo "$WYNK_VS_EXPRESS_READ > 1" | bc)
    if [ "$FASTER" -eq 1 ]; then
        echo "- WynkJS is **${WYNK_VS_EXPRESS_READ}x faster** than Express.js ($WYNK_READ vs $EXPRESS_READ req/s)" >> "$OUTPUT_FILE"
    else
        echo "- Express.js is **${EXPRESS_VS_WYNK_READ}x faster** than WynkJS ($EXPRESS_READ vs $WYNK_READ req/s)" >> "$OUTPUT_FILE"
    fi
else
    echo "- No data available for WynkJS vs Express.js comparison" >> "$OUTPUT_FILE"
fi

if [ "$WYNK_VS_NEST_READ" != "N/A" ]; then
    FASTER=$(echo "$WYNK_VS_NEST_READ > 1" | bc)
    if [ "$FASTER" -eq 1 ]; then
        echo "- WynkJS is **${WYNK_VS_NEST_READ}x faster** than NestJS ($WYNK_READ vs $NEST_READ req/s)" >> "$OUTPUT_FILE"
    else
        echo "- NestJS is **${NEST_VS_WYNK_READ}x faster** than WynkJS ($NEST_READ vs $WYNK_READ req/s)" >> "$OUTPUT_FILE"
    fi
else
    echo "- No data available for WynkJS vs NestJS comparison" >> "$OUTPUT_FILE"
fi

if [ "$ELYSIA_READ" != "N/A" ] && [ ! -z "$ELYSIA_READ" ]; then
    if [ "$WYNK_READ" != "N/A" ] && [ ! -z "$WYNK_READ" ]; then
        WYNK_VS_ELYSIA_READ=$(calc_ratio "$WYNK_READ" "$ELYSIA_READ")
        ELYSIA_VS_WYNK_READ=$(calc_ratio "$ELYSIA_READ" "$WYNK_READ")
        
        FASTER=$(echo "$WYNK_VS_ELYSIA_READ > 1" | bc)
        if [ "$FASTER" -eq 1 ]; then
            echo "- WynkJS is **${WYNK_VS_ELYSIA_READ}x faster** than Raw Elysia.js ($WYNK_READ vs $ELYSIA_READ req/s)" >> "$OUTPUT_FILE"
        else
            echo "- Raw Elysia.js is **${ELYSIA_VS_WYNK_READ}x faster** than WynkJS ($ELYSIA_READ vs $WYNK_READ req/s)" >> "$OUTPUT_FILE"
        fi
    fi
fi

cat >> "$OUTPUT_FILE" << EOF

**Database Write:**
EOF

if [ "$WYNK_WRITE" != "N/A" ] && [ "$EXPRESS_WRITE" != "N/A" ]; then
    WYNK_VS_EXPRESS_WRITE=$(calc_ratio "$WYNK_WRITE" "$EXPRESS_WRITE")
    EXPRESS_VS_WYNK_WRITE=$(calc_ratio "$EXPRESS_WRITE" "$WYNK_WRITE")
    
    FASTER=$(echo "$WYNK_VS_EXPRESS_WRITE > 1" | bc)
    if [ "$FASTER" -eq 1 ]; then
        echo "- WynkJS is **${WYNK_VS_EXPRESS_WRITE}x faster** than Express.js ($WYNK_WRITE vs $EXPRESS_WRITE req/s)" >> "$OUTPUT_FILE"
    else
        echo "- Express.js is **${EXPRESS_VS_WYNK_WRITE}x faster** than WynkJS ($EXPRESS_WRITE vs $WYNK_WRITE req/s)" >> "$OUTPUT_FILE"
    fi
else
    echo "- No data available (tests not implemented yet)" >> "$OUTPUT_FILE"
fi

if [ "$WYNK_WRITE" != "N/A" ] && [ "$NEST_WRITE" != "N/A" ]; then
    WYNK_VS_NEST_WRITE=$(calc_ratio "$WYNK_WRITE" "$NEST_WRITE")
    NEST_VS_WYNK_WRITE=$(calc_ratio "$NEST_WRITE" "$WYNK_WRITE")
    
    FASTER=$(echo "$WYNK_VS_NEST_WRITE > 1" | bc)
    if [ "$FASTER" -eq 1 ]; then
        echo "- WynkJS is **${WYNK_VS_NEST_WRITE}x faster** than NestJS ($WYNK_WRITE vs $NEST_WRITE req/s)" >> "$OUTPUT_FILE"
    else
        echo "- NestJS is **${NEST_VS_WYNK_WRITE}x faster** than WynkJS ($NEST_WRITE vs $WYNK_WRITE req/s)" >> "$OUTPUT_FILE"
    fi
fi

cat >> "$OUTPUT_FILE" << 'EOF'

### Key Findings

- **Simple Response:** Performance varies across frameworks for simple health check endpoints
- **Database Operations:** Performance normalized when actual I/O operations are involved
- **Validation + Write:** Database write benchmarks provide insight into real-world CRUD performance

### Methodology

This benchmark follows industry-standard practices similar to [Elysia.js benchmarks](https://elysiajs.com/at-glance.html#performance) and [TechEmpower Framework Benchmarks](https://www.techempower.com/benchmarks/):

1. **Fair Comparison:** All frameworks use identical database schema, queries, and endpoints
2. **Production Mode:** Logging disabled, optimizations enabled
3. **Realistic Load:** 100 concurrent connections simulating real-world traffic
4. **Warmup Phase:** Initial runs discarded to account for JIT compilation
5. **Multiple Scenarios:** Tests simple responses, database reads, and database writes with validation

### Raw Results

Detailed autocannon output available in:
- `result/wynkjs-*.txt`
- `result/expressjs-*.txt`
- `result/nestjs-*.txt`
- `result/raw-elysia-*.txt`

---

**Generated on:** $(date +"%Y-%m-%d %H:%M:%S")
EOF

# Process the template to fill in actual date
sed -i.bak "s/\$(date +\"%Y-%m-%d %H:%M:%S\")/$(date +"%Y-%m-%d %H:%M:%S")/g" "$OUTPUT_FILE"
rm "${OUTPUT_FILE}.bak"

echo "✅ Analysis complete!"
echo ""
echo "📄 Summary report: $OUTPUT_FILE"
echo ""
echo "Opening report..."
cat "$OUTPUT_FILE"
