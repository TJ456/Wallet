# Use the official Go image as a builder - Alpine for smaller image
FROM golang:1.24.2-alpine AS builder

# Install build tools and git (needed for private repos)
RUN apk add --no-cache git build-base gcc musl-dev

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum first for better caching
COPY go.mod go.sum ./

# Download dependencies and verify modules
RUN go mod download && \
    go mod verify

# Copy the rest of the backend code
COPY . .

# Build the application with optimizations
ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

# Clean and build
RUN go clean && \
    go mod tidy && \
    go build -tags netgo -a -v -ldflags="-s -w -extldflags '-static'" -o out .

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
