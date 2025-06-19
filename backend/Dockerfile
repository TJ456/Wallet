# Build stage
FROM golang:1.24.2-bullseye AS builder

WORKDIR /build/Wallet/backend

# Install build essentials
RUN apt-get update && \
    apt-get install -y build-essential git ca-certificates && \
    update-ca-certificates

# Copy go.mod and go.sum first for better caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download && go mod verify

# Copy the rest of the code
COPY . .

# Build the binary (with verbose output)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v -o server main.go

# Final stage
FROM debian:bullseye-slim

# Install SSL certificates and timezone data
RUN apt-get update && \
    apt-get install -y ca-certificates tzdata && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user and app directory
RUN useradd -m -u 1001 appuser && \
    mkdir -p /app && \
    chown appuser:appuser /app

# Set up app directory
WORKDIR /app

# Copy binary and start script from builder
COPY --from=builder /build/Wallet/backend/server ./
COPY --from=builder /build/Wallet/backend/start.sh ./

# Set permissions
RUN chmod +x server start.sh && \
    chown appuser:appuser server start.sh

# Use non-root user
USER appuser

# Set environment variables
ENV GO_ENV=production \
    PORT=8080 \
    GIN_MODE=release

# Expose port
EXPOSE 8080

# Use start script
CMD ["./start.sh"]