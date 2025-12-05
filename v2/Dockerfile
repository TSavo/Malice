# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including tsx)
RUN npm ci

# Copy source code and types
COPY src ./src
COPY types ./types
COPY tsconfig.json ./

# Expose ports
EXPOSE 5555 8080

# Start the server using tsx
CMD ["npx", "tsx", "src/index.ts"]
