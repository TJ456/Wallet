# Use the official Go image as a builder
FROM golang:1.22 AS builder

WORKDIR /app

# Copy go.mod and go.sum first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the entire backend directory
COPY . .

# Build the application without CGo
ENV CGO_ENABLED=0
RUN go build -o out .

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
