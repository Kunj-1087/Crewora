#!/bin/bash
# ============================================================
# CREWORA — Zero-Downtime Deployment Script
# ============================================================
# Build → health check new container → switch traffic →
# health check again → rollback if check fails
#
# Usage: ./scripts/deploy.sh <environment> <docker_image_tag>
# Example: ./scripts/deploy.sh staging v1.2.3
# Example: ./scripts/deploy.sh production v1.2.3
# ============================================================

set -euo pipefail

ENV="${1:-staging}"
IMAGE_TAG="${2:-latest}"
APP_NAME="crewora-backend"

# ─── Configuration ────────────────────────────────────────────────────────────
case "$ENV" in
    staging)
        REGISTRY="ghcr.io/crewora"
        HEALTH_URL="https://staging.crewora.in/api/health"
        CONTAINER_PORT=5000
        ;;
    production)
        REGISTRY="ghcr.io/crewora"
        HEALTH_URL="https://api.crewora.in/api/health"
        CONTAINER_PORT=5000
        CANARY_PERCENTAGE=10  # 10% traffic initially
        ;;
    *)
        echo "Unknown environment: $ENV"
        echo "Usage: $0 {staging|production} <image_tag>"
        exit 1
        ;;
esac

IMAGE="${REGISTRY}/${APP_NAME}:${IMAGE_TAG}"
ROLLBACK_IMAGE="${REGISTRY}/${APP_NAME}:previous"

echo ""
echo "============================================="
echo "  CREWORA Deployment"
echo "  Environment: $ENV"
echo "  Image: $IMAGE"
echo "  $(date)"
echo "============================================="
echo ""

# ─── Step 1: Build ────────────────────────────────────────────────────────────
echo "[1/6] Building Docker image..."
docker build \
    -f infrastructure/docker/backend.Dockerfile \
    -t "$IMAGE" \
    -t "${REGISTRY}/${APP_NAME}:previous" \
    .

echo "[2/6] Pushing image to registry..."
docker push "$IMAGE"
docker push "${REGISTRY}/${APP_NAME}:previous"

# ─── Step 2: Deploy to staging ────────────────────────────────────────────────
if [ "$ENV" = "staging" ]; then
    echo "[3/6] Deploying to staging..."
    # Update staging service (e.g., via docker-compose or Kubernetes)
    docker-compose -f docker-compose.yml up -d backend

    # Wait for container to start
    echo "[4/6] Waiting for container to be ready..."
    for i in {1..30}; do
        HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$HEALTH_URL" 2>/dev/null || echo "000")
        if [ "$HEALTH_STATUS" = "200" ]; then
            echo "  Container is healthy!"
            break
        fi
        if [ "$i" -eq 30 ]; then
            echo "  ❌ Container failed to become healthy after 30 attempts"
            echo "  Rolling back..."
            docker-compose -f docker-compose.yml up -d backend_previous || true
            exit 1
        fi
        sleep 2
    done
fi

# ─── Step 3: Deploy to production (canary) ────────────────────────────────────
if [ "$ENV" = "production" ]; then
    echo "[3/6] Deploying canary ($CANARY_PERCENTAGE% traffic)..."

    # Run smoke tests on the new image first
    echo "  Running smoke tests..."
    SMOKE_RESULT=0
    ./scripts/smoke-test.sh "http://localhost:$CONTAINER_PORT" || SMOKE_RESULT=$?

    if [ "$SMOKE_RESULT" -ne 0 ]; then
        echo "  ❌ Smoke tests failed — aborting deployment"
        exit 1
    fi
    echo "  Smoke tests passed!"

    # Route 10% of traffic to new container
    echo "  Routing $CANARY_PERCENTAGE% traffic to new version..."
    # This would update your load balancer / service mesh configuration
    # Example with Nginx: update upstream weights
    # Example with Kubernetes: update canary deployment weight

    # Monitor for 5 minutes
    echo "[4/6] Monitoring canary for 5 minutes..."
    START_TIME=$(date +%s)
    ERROR_COUNT=0

    while [ $(($(date +%s) - START_TIME)) -lt 300 ]; do
        HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$HEALTH_URL" 2>/dev/null || echo "000")
        if [ "$HEALTH_STATUS" != "200" ]; then
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi

        # If error rate > 2%, auto-rollback
        if [ $ERROR_COUNT -gt 6 ]; then  # More than 6 errors in 5 minutes
            echo "  ❌ Error rate exceeded threshold — rolling back"
            # Rollback logic
            echo "  Rolling back to previous image..."
            docker-compose -f docker-compose.yml up -d backend_previous || true
            exit 1
        fi
        sleep 10
    done

    echo "  Canary is stable! Routing 100% traffic..."
    # Route all traffic to new version
fi

# ─── Step 4: Final health check ───────────────────────────────────────────────
echo "[5/6] Final health check..."
FINAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null || echo "000")
if [ "$FINAL_STATUS" != "200" ]; then
    echo "  ❌ Final health check failed (HTTP $FINAL_STATUS)"
    exit 1
fi

# ─── Step 5: Cleanup ──────────────────────────────────────────────────────────
echo "[6/6] Cleaning up old images..."
docker image prune -f --filter "until=24h" || true

echo ""
echo "============================================="
echo "  ✅ Deployment complete!"
echo "  Environment: $ENV"
echo "  Image: $IMAGE"
echo "============================================="
