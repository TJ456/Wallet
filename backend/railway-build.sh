# Railway build script with better error handling
set -e

echo "======== Railway Direct Build Script ========"
echo "Environment information:"
echo "Working directory: $(pwd)"
ls -la
echo "Go version:"
go version
echo "System information:"
uname -a

echo "\nFixing go.mod file..."
sed -i 's/go 1.23.0/go 1.21.0/' go.mod
sed -i 's/toolchain go1.24.2//' go.mod

echo "\nBuilding with CGO disabled..."
export CGO_ENABLED=0
go build -o app .

echo "\nBuild completed!"
ls -la app

echo "\nStarting application..."
exec ./app
