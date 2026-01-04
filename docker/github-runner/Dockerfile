# GitHub Actions Self-Hosted Runner
# Base image with Docker-in-Docker support for running containerized jobs

FROM ubuntu:24.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies (including libicu for .NET runner)
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    lsb-release \
    git \
    jq \
    sudo \
    unzip \
    zip \
    wget \
    libicu74 \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI (for docker commands inside runner)
RUN install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && chmod a+r /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y docker-ce-cli docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22.x (for npm/tsx commands)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Bun runtime
RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL=/root/.bun
ENV PATH=$BUN_INSTALL/bin:$PATH

# Create runner user
RUN useradd -m -s /bin/bash runner \
    && usermod -aG sudo runner \
    && echo "runner ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Add runner to docker group (will be created at runtime if needed)
RUN groupadd -f docker && usermod -aG docker runner

# Set up runner directory
WORKDIR /home/runner/actions-runner

# Download and extract GitHub Actions runner (use latest version)
ARG RUNNER_VERSION=2.330.0
RUN curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L \
    https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz \
    && tar xzf ./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz \
    && rm actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz \
    && ./bin/installdependencies.sh \
    && chown -R runner:runner /home/runner/actions-runner \
    && mkdir -p /home/runner/actions-runner/_work/_update \
    && chown -R runner:runner /home/runner/actions-runner/_work

# Copy entrypoint script (ensure it's readable and executable by all, fix line endings)
COPY entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh && sed -i 's/\r$//' /entrypoint.sh

USER runner

ENTRYPOINT ["/entrypoint.sh"]
