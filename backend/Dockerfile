FROM golang:1.24.2-alpine

# Install build tools
RUN apk add --no-cache git

WORKDIR /app

# Copy everything
COPY . .

# Download dependencies and build
RUN go mod download && \
    CGO_ENABLED=0 go build -o main

# Run the binary
CMD ["./main"]

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
