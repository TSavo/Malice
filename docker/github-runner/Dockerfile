# syntax=docker/dockerfile:1
# GitHub Actions Self-Hosted Runner
# CI image - inherits from prebuilt base
ARG BASE_IMAGE=tsavo/malice-runner-base:latest
FROM ${BASE_IMAGE}

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh && sed -i 's/\r$//' /entrypoint.sh

USER runner

ENTRYPOINT ["/entrypoint.sh"]
