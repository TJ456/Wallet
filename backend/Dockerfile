# Use the official Go image as a builder - using a specific version for stability
FROM golang:1.21 AS builder

WORKDIR /app

# Fix go.mod versions before copying
COPY go.mod go.sum ./
RUN sed -i 's/go 1.23.0/go 1.21.0/' go.mod && \
    sed -i 's/toolchain go1.24.2//' go.mod && \
    go mod download

# Copy the entire backend directory
COPY . .

# Build the application without CGo and with explicit flags
ENV CGO_ENABLED=0
RUN go build -ldflags="-s -w" -o out .

# Use a smaller image for the final stage
FROM alpine:latest

WORKDIR /app
# Install CA certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Copy the binary from the builder stage
COPY --from=builder /app/out /app/out

# Copy any configuration files
COPY --from=builder /app/.env* /app/

# Expose the port your application runs on
EXPOSE 8080

# Run the binary
CMD ["/app/out"]
