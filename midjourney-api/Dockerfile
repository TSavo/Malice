FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source and build
COPY tsconfig.json ./
COPY src ./src

# Install dev dependencies for build, then remove
RUN npm install && npm run build && npm prune --production

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
