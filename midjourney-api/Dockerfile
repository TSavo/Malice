FROM node:20-alpine

# Install oxipng for lossless PNG compression
RUN apk add --no-cache oxipng

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --production

# Create outputs directory
RUN mkdir -p /app/outputs

# Expose port
EXPOSE 3000

# Environment variables (provide via docker-compose or docker run)
ENV PORT=3000
ENV DEBUG=false
ENV OUTPUT_DIR=/app/outputs

# Start the server
CMD ["npm", "start"]
