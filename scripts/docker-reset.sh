#!/bin/bash
set -e

echo "=== Docker Reset: Full World Rebuild ==="
echo ""

# Step 1: Stop all services
echo "Step 1: Stopping all services..."
docker compose down

# Step 2: Build game container
echo ""
echo "Step 2: Building game container..."
docker compose build game

# Step 3: Start MongoDB and wait for health
echo ""
echo "Step 3: Starting MongoDB..."
docker compose up -d mongodb

echo "Waiting for MongoDB to be healthy..."
TIMEOUT=60
ELAPSED=0
while ! docker compose ps mongodb 2>/dev/null | grep -q healthy; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "ERROR: MongoDB did not become healthy within ${TIMEOUT}s"
    docker compose logs mongodb --tail=20
    exit 1
  fi
  echo "  ... waiting (${ELAPSED}s)"
done
echo "MongoDB is healthy!"

# Step 4: Drop database
echo ""
echo "Step 4: Dropping malice database..."
docker exec malice-mongo mongosh --quiet --eval 'db.dropDatabase()' malice

# Step 5: Run bootstrap
echo ""
echo "Step 5: Running world bootstrap (--full)..."
docker compose run --rm game npx tsx src/scripts/bootstrap-world.ts --full

# Step 6: Start all services
echo ""
echo "Step 6: Starting all services..."
docker compose up -d

echo "Waiting for game server to be healthy..."
TIMEOUT=120
ELAPSED=0
while ! docker compose ps game 2>/dev/null | grep -q healthy; do
  sleep 3
  ELAPSED=$((ELAPSED + 3))
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "WARNING: Game server did not report healthy within ${TIMEOUT}s"
    echo "Check logs with: docker compose logs game"
    break
  fi
  echo "  ... waiting (${ELAPSED}s)"
done

echo ""
echo "=== Docker Reset Complete ==="
docker compose ps
