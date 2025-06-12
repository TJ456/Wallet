#!/bin/sh
# This is a root-level script for Render to start the Go application

# Use default port 8080 if not specified by Render
export PORT=${PORT:-8080}

# Run the Go binary
exec /app/out
