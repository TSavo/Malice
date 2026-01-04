#!/bin/bash
set -e

# GitHub Actions Self-Hosted Runner Entrypoint
# Registers the runner on startup and deregisters on shutdown

# Required environment variables:
#   GITHUB_TOKEN - Personal access token or fine-grained token with:
#                  - repo scope (for private repos)
#                  - OR admin:org scope (for org-level runners)
#   GITHUB_REPOSITORY - Owner/repo format (e.g., "myorg/Malice")
#   RUNNER_NAME - Name for this runner (default: hostname)
#   RUNNER_LABELS - Comma-separated labels (default: "self-hosted,Linux,X64")
#   RUNNER_WORKDIR - Working directory (default: "_work")
#   RUNNER_GROUP - Runner group (default: "Default")

cd /home/runner/actions-runner

# Validate required environment variables
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN is required"
    exit 1
fi

if [ -z "$GITHUB_REPOSITORY" ]; then
    echo "Error: GITHUB_REPOSITORY is required (format: owner/repo)"
    exit 1
fi

# Set defaults - use prefix + hostname for unique names when scaling
RUNNER_NAME_PREFIX="${RUNNER_NAME_PREFIX:-malice-runner}"
RUNNER_NAME="${RUNNER_NAME:-${RUNNER_NAME_PREFIX}-$(hostname)}"
RUNNER_LABELS="${RUNNER_LABELS:-self-hosted,Linux,X64,malice}"
RUNNER_WORKDIR="${RUNNER_WORKDIR:-_work}"
RUNNER_GROUP="${RUNNER_GROUP:-Default}"

echo "=================================================="
echo "GitHub Actions Self-Hosted Runner"
echo "=================================================="
echo "Repository: $GITHUB_REPOSITORY"
echo "Runner Name: $RUNNER_NAME"
echo "Labels: $RUNNER_LABELS"
echo "Work Directory: $RUNNER_WORKDIR"
echo "=================================================="

# Get registration token from GitHub API
echo "Obtaining registration token..."
REG_TOKEN=$(curl -s -X POST \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runners/registration-token" \
    | jq -r '.token')

if [ "$REG_TOKEN" == "null" ] || [ -z "$REG_TOKEN" ]; then
    echo "Error: Failed to get registration token. Check your GITHUB_TOKEN permissions."
    echo "Required scopes: repo (for private repos) or admin:org (for org runners)"
    exit 1
fi

echo "Registration token obtained successfully"

# Configure the runner
echo "Configuring runner..."
./config.sh \
    --url "https://github.com/${GITHUB_REPOSITORY}" \
    --token "$REG_TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "$RUNNER_LABELS" \
    --work "$RUNNER_WORKDIR" \
    --runnergroup "$RUNNER_GROUP" \
    --unattended \
    --replace

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    echo "Received shutdown signal, removing runner..."

    # Get removal token
    REMOVE_TOKEN=$(curl -s -X POST \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runners/remove-token" \
        | jq -r '.token')

    if [ "$REMOVE_TOKEN" != "null" ] && [ -n "$REMOVE_TOKEN" ]; then
        ./config.sh remove --token "$REMOVE_TOKEN"
        echo "Runner removed successfully"
    else
        echo "Warning: Could not get removal token, runner may remain registered"
    fi

    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGTERM SIGINT SIGQUIT

echo "Starting runner..."
echo "=================================================="

# Run the runner (exec to replace shell process)
exec ./run.sh
