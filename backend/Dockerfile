# Use the official Go image as a builder - Alpine for smaller image
FROM golang:1.24-alpine AS builder

# Install build tools
RUN apk add --no-cache git build-base

WORKDIR /app

# Copy and download dependencies
COPY go.mod go.sum ./
RUN go mod tidy && \
    go get github.com/civicteam/gateway-go-client && \
    go mod download

# Copy the entire backend directory
COPY . .

# Build without cache mounting (for compatibility with various build systems)
ENV CGO_ENABLED=0
RUN go mod tidy && go build -ldflags="-s -w" -o out .

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
