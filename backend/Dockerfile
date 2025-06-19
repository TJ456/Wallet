# Use the official Go image as a builder - Alpine for smaller image
FROM golang:1.24-alpine AS builder

# Install build tools
RUN apk add --no-cache git build-base

WORKDIR /app

# Copy the entire backend directory first
COPY . .

# Set up go.mod and dependencies
RUN go mod init Wallet/backend || true && \
    go mod tidy && \
    go get -u github.com/civicteam/gateway-go-client/pkg/gateway@latest && \
    go mod tidy

# Build the application
ENV CGO_ENABLED=0
RUN go build -ldflags="-s -w" -o out .

# Use a smaller image for the final stage
FROM alpine:latest

WORKDIR /app
# Install CA certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Copy the binary from the builder stage
COPY --from=builder /app/out /app/out

# Copy any configuration files and the start script
COPY --from=builder /app/.env* /app/
COPY --from=builder /app/start.sh /app/start.sh

# Make the start script executable
RUN chmod +x /app/start.sh

# Expose the port your application runs on
EXPOSE 8080

# Run the binary via the start script
CMD ["/app/start.sh"]
