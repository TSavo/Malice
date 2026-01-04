#!/bin/bash
#
# GitHub Actions Self-Hosted Runner Setup Script
#
# This script sets up a self-hosted GitHub Actions runner on the production server.
# It can be run directly on the server or copied there and executed.
#
# Usage:
#   ./scripts/setup-runner.sh
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - GitHub Personal Access Token with 'repo' scope
#   - Running from the Malice repository root

set -e

echo "=================================================="
echo "GitHub Actions Self-Hosted Runner Setup"
echo "=================================================="

# Check we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: Run this script from the Malice repository root"
    exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    echo "Install with: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check for existing .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
    else
        touch .env
    fi
fi

# Check for required environment variables
if [ -z "$GITHUB_TOKEN" ]; then
    if grep -q "^GITHUB_TOKEN=" .env 2>/dev/null; then
        source .env
    fi
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo ""
    echo "GITHUB_TOKEN not found in environment or .env"
    echo ""
    echo "To create a token:"
    echo "1. Go to https://github.com/settings/tokens"
    echo "2. Create a 'Fine-grained token' or 'Classic token'"
    echo "3. For Classic tokens: enable 'repo' scope"
    echo "4. For Fine-grained tokens: select your repo and enable:"
    echo "   - Actions: Read and write"
    echo "   - Administration: Read and write"
    echo ""
    read -p "Enter your GitHub token: " GITHUB_TOKEN
    echo ""

    if [ -z "$GITHUB_TOKEN" ]; then
        echo "Error: Token is required"
        exit 1
    fi

    # Save to .env
    if grep -q "^GITHUB_TOKEN=" .env 2>/dev/null; then
        sed -i "s/^GITHUB_TOKEN=.*/GITHUB_TOKEN=$GITHUB_TOKEN/" .env
    else
        echo "GITHUB_TOKEN=$GITHUB_TOKEN" >> .env
    fi
    echo "Token saved to .env"
fi

# Check for repository
if [ -z "$GITHUB_REPOSITORY" ]; then
    if grep -q "^GITHUB_REPOSITORY=" .env 2>/dev/null; then
        source .env
    fi
fi

if [ -z "$GITHUB_REPOSITORY" ]; then
    # Try to detect from git remote
    DETECTED_REPO=$(git remote get-url origin 2>/dev/null | sed -n 's/.*github.com[:/]\(.*\)\.git/\1/p' || echo "")

    if [ -n "$DETECTED_REPO" ]; then
        echo "Detected repository: $DETECTED_REPO"
        read -p "Use this repository? [Y/n]: " USE_DETECTED
        if [ "$USE_DETECTED" != "n" ] && [ "$USE_DETECTED" != "N" ]; then
            GITHUB_REPOSITORY="$DETECTED_REPO"
        fi
    fi

    if [ -z "$GITHUB_REPOSITORY" ]; then
        read -p "Enter repository (owner/repo format): " GITHUB_REPOSITORY
    fi

    if [ -z "$GITHUB_REPOSITORY" ]; then
        echo "Error: Repository is required"
        exit 1
    fi

    # Save to .env
    if grep -q "^GITHUB_REPOSITORY=" .env 2>/dev/null; then
        sed -i "s|^GITHUB_REPOSITORY=.*|GITHUB_REPOSITORY=$GITHUB_REPOSITORY|" .env
    else
        echo "GITHUB_REPOSITORY=$GITHUB_REPOSITORY" >> .env
    fi
    echo "Repository saved to .env"
fi

echo ""
echo "Configuration:"
echo "  Repository: $GITHUB_REPOSITORY"
echo "  Token: ${GITHUB_TOKEN:0:10}..."
echo ""

# Verify token has access
echo "Verifying GitHub token..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    "https://api.github.com/repos/${GITHUB_REPOSITORY}")

if [ "$RESPONSE" != "200" ]; then
    echo "Error: Cannot access repository (HTTP $RESPONSE)"
    echo "Check that your token has access to $GITHUB_REPOSITORY"
    exit 1
fi
echo "Token verified successfully"

# Create Docker network if it doesn't exist
echo ""
echo "Ensuring Docker network exists..."
docker network inspect malice-network >/dev/null 2>&1 || \
    docker network create --subnet=172.20.0.0/16 malice-network

# Build the runner image
echo ""
echo "Building runner image..."
docker compose -f docker-compose.runner.yml build

# Start the runner
echo ""
echo "Starting runner..."
docker compose -f docker-compose.runner.yml up -d

# Wait for it to register
echo ""
echo "Waiting for runner to register..."
sleep 5

# Check status
if docker ps --filter "name=malice-runner" --filter "status=running" | grep -q malice-runner; then
    echo ""
    echo "=================================================="
    echo "Runner started successfully!"
    echo "=================================================="
    echo ""
    echo "View logs:"
    echo "  docker logs -f malice-runner"
    echo ""
    echo "Check runner status:"
    echo "  https://github.com/${GITHUB_REPOSITORY}/settings/actions/runners"
    echo ""
    echo "Stop runner:"
    echo "  docker compose -f docker-compose.runner.yml down"
    echo ""
else
    echo ""
    echo "Error: Runner failed to start"
    echo "Check logs with: docker logs malice-runner"
    exit 1
fi
