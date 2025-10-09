# Multi-stage build for optimized production image
FROM oven/bun:1-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --production=false

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS production

# Install lightweight http server
RUN bun install -g http-server

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start the server
CMD [ "http-server", "dist", "-p", "8080", "-a", "0.0.0.0" ]