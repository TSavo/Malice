# syntax=docker/dockerfile:1
# CI/Production image - inherits from prebuilt base
ARG BASE_IMAGE=tsavo/malice-base:latest
FROM ${BASE_IMAGE}

# Copy source code (deps already installed in base)
COPY --chown=bun:bun src ./src
COPY --chown=bun:bun types ./types
COPY --chown=bun:bun tsconfig.json ./
COPY --chown=bun:bun docs ./docs
COPY --chown=bun:bun world-map-3d.html ./

USER bun
EXPOSE 5555 8080
CMD ["bun", "run", "src/index.ts"]
