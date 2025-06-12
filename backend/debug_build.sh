#!/bin/sh
# Script to manually debug build issues in Railway

echo "Debugging Go build in Railway environment"
echo "Go version:"
go version

echo "\nFixing go.mod file..."
sed -i 's/go 1.23.0/go 1.21.0/' go.mod
sed -i 's/toolchain go1.24.2//' go.mod

echo "\ngo.mod contents:"
cat go.mod

echo "\nAvailable environment:"
env | grep -v PASSWORD | grep -v SECRET | grep -v KEY

echo "\nAttempting build..."
CGO_ENABLED=0 go build -v -ldflags="-s -w" -o out .

echo "\nBuild result: $?"

if [ -f "out" ]; then
  echo "Build successful - binary created"
  ls -la out
else
  echo "Build failed - no binary"
fi
