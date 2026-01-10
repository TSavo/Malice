# syntax=docker/dockerfile:1
# Use official Bun image
FROM oven/bun:1

# Install tools for healthcheck and Claude Code CLI
RUN apt-get update && apt-get install -y netcat-openbsd curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Match official Claude devcontainer setup
ENV DEVCONTAINER=true

# Install Node.js for Claude Code CLI (requires Node runtime)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI for SDK runtime (tailor agent)
RUN npm install -g @anthropic-ai/claude-code

# Copy package files and bun lockfile
COPY --chown=bun:bun package.json bun.lock ./

# Install dependencies with Bun
RUN bun install --frozen-lockfile

# Copy source code and types
COPY --chown=bun:bun src ./src
COPY --chown=bun:bun types ./types
COPY --chown=bun:bun tsconfig.json ./

# Copy all documentation for MCP resources
COPY --chown=bun:bun docs ./docs

# Copy web assets
COPY --chown=bun:bun world-map-3d.html ./

# Copy underground room data
COPY --chown=bun:bun underground-world-fresh-described-fixed.json ./

# Set Claude home for credentials (mounted from host)
ENV CLAUDE_CONFIG_DIR=/home/bun/.claude
ENV HOME=/home/bun

# Create .claude directory for SDK debug logs (must exist before USER switch)
RUN mkdir -p /home/bun/.claude/debug && chown -R bun:bun /home/bun/.claude

# Switch to non-root user
USER bun

# Expose ports
EXPOSE 5555 8080

# Start the server using Bun
CMD ["bun", "run", "src/index.ts"]
