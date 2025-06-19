# Stage 1: Build the Go binary
FROM golang:1.24.2-alpine AS builder

# Install build tools and git
RUN apk add --no-cache git build-base gcc musl-dev

# Set up proper Go path and create module structure
WORKDIR /app
RUN mkdir -p Wallet/backend

# Copy the entire backend directory
COPY . Wallet/backend/

# Set working directory to the module path
WORKDIR /app/Wallet/backend

# Initialize and tidy the module
RUN cd /app/Wallet/backend && \
    go mod tidy && \
    go mod download && \
    go mod verify

# Set build environment variables
ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64 \
    GO111MODULE=on

# Build the application with error output
RUN cd /app/Wallet/backend && \
    pwd && \
    ls -la && \
    go build -v -o app .

# Stage 2: Create the final image
FROM alpine:latest

# Add CA certificates and timezone data
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /go/src/Wallet/backend/app .

# Set binary as executable
RUN chmod +x /app/app

# Command to run the binary
CMD ["/app/app"]

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
