#!/bin/bash
# ============================================================
# CREWORA — Smoke Test Script
# ============================================================
# Runs 5 critical endpoint checks after deployment.
# If any test fails, the deployment should be rolled back.
#
# Usage: ./scripts/smoke-test.sh <base_url>
# Example: ./scripts/smoke-test.sh https://staging.crewora.in
# ============================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:5000}"
PASS=0
FAIL=0
FAILURES=()

log_test() {
    local test_name="$1"
    local status="$2"
    if [ "$status" -eq 0 ]; then
        echo "  ✅ $test_name"
        PASS=$((PASS + 1))
    else
        echo "  ❌ $test_name"
        FAIL=$((FAIL + 1))
        FAILURES+=("$test_name")
    fi
}

echo ""
echo "============================================="
echo "  CREWORA — Smoke Tests"
echo "  Base URL: $BASE_URL"
echo "  $(date)"
echo "============================================="
echo ""

# ─── Test 1: Health endpoint ──────────────────────────────────────────────────
echo "[1/5] Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL/api/health" 2>/dev/null || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    HEALTH_BODY=$(curl -s --max-time 5 "$BASE_URL/api/health" 2>/dev/null || echo "{}")
    STATUS=$(echo "$HEALTH_BODY" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$STATUS" = "ok" ]; then
        log_test "GET /api/health returns 200 with status=ok" 0
    else
        log_test "GET /api/health response body unexpected: $HEALTH_BODY" 1
    fi
else
    log_test "GET /api/health returned HTTP $HEALTH_RESPONSE (expected 200)" 1
fi

# ─── Test 2: Invalid OTP (expects 400) ────────────────────────────────────────
echo "[2/5] Testing validation (invalid OTP)..."
OTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    -X POST "$BASE_URL/api/v1/auth/customer/login" \
    -H "Content-Type: application/json" \
    -d '{"phone":"9876543210","otp":"000000"}' 2>/dev/null || echo "000")
if [ "$OTP_RESPONSE" = "400" ]; then
    log_test "POST /auth/customer/login with invalid OTP returns 400" 0
else
    log_test "POST /auth/customer/login returned HTTP $OTP_RESPONSE (expected 400)" 1
fi

# ─── Test 3: Unauthenticated request (expects 401) ────────────────────────────
echo "[3/5] Testing auth enforcement..."
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    "$BASE_URL/api/v1/jobs" 2>/dev/null || echo "000")
if [ "$AUTH_RESPONSE" = "401" ]; then
    log_test "GET /api/v1/jobs without auth returns 401" 0
else
    log_test "GET /api/v1/jobs returned HTTP $AUTH_RESPONSE (expected 401)" 1
fi

# ─── Test 4: Invalid route (expects 404) ──────────────────────────────────────
echo "[4/5] Testing 404 handling..."
NF_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    "$BASE_URL/api/v1/nonexistent-route" 2>/dev/null || echo "000")
if [ "$NF_RESPONSE" = "404" ]; then
    log_test "GET /nonexistent-route returns 404" 0
else
    log_test "GET /nonexistent-route returned HTTP $NF_RESPONSE (expected 404)" 1
fi

# ─── Test 5: CORS headers ─────────────────────────────────────────────────────
echo "[5/5] Testing CORS headers..."
CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    -X OPTIONS "$BASE_URL/api/health" \
    -H "Origin: https://crewora.in" \
    -H "Access-Control-Request-Method: GET" 2>/dev/null || echo "000")
if [ "$CORS_RESPONSE" = "204" ] || [ "$CORS_RESPONSE" = "200" ]; then
    log_test "OPTIONS /api/health with valid origin passes CORS" 0
else
    log_test "OPTIONS /api/health CORS check returned HTTP $CORS_RESPONSE (expected 204/200)" 1
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "============================================="
echo "  SMOKE TEST RESULTS"
echo "  Passed: $PASS / Failed: $FAIL"
echo "============================================="

if [ "$FAIL" -gt 0 ]; then
    echo ""
    echo "Failed tests:"
    for failure in "${FAILURES[@]}"; do
        echo "  • $failure"
    done
    echo ""
    echo "❌ Smoke tests FAILED — deployment should be rolled back"
    exit 1
fi

echo ""
echo "✅ All smoke tests passed!"
exit 0
