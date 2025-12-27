# Use Node.js 20 (full image needed for Claude SDK)
FROM node:20

# Install tools for healthcheck
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Match official Claude devcontainer setup
ENV DEVCONTAINER=true

# Install Claude Code CLI for SDK runtime (tailor agent)
RUN npm install -g @anthropic-ai/claude-code

# Copy package files
COPY --chown=node:node package*.json ./

# Install dependencies (including tsx)
RUN npm ci

# Copy source code and types
COPY --chown=node:node src ./src
COPY --chown=node:node types ./types
COPY --chown=node:node tsconfig.json ./

# Copy all documentation for MCP resources
COPY --chown=node:node docs ./docs

# Set Claude home for credentials (mounted from host)
ENV CLAUDE_CONFIG_DIR=/home/node/.claude
ENV HOME=/home/node

# Create .claude directory for SDK debug logs (must exist before USER switch)
RUN mkdir -p /home/node/.claude/debug && chown -R node:node /home/node/.claude

# Switch to non-root user (matches npc-agent)
USER node

# Expose ports
EXPOSE 5555 8080

# Start the server using tsx
CMD ["npx", "tsx", "src/index.ts"]
