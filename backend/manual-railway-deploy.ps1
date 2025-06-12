# PowerShell script to build and manually push Docker image to Railway
# This approach avoids dependency on Railway's build system

# Stop on error
$ErrorActionPreference = "Stop"

# Ensure Docker is running
Write-Host "Checking Docker..." -ForegroundColor Cyan
docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running or not installed." -ForegroundColor Red
    exit 1
}

# Build the Docker image locally
Write-Host "Building Docker image..." -ForegroundColor Cyan
docker build -t wallet-backend-railway -f Dockerfile.railway .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed." -ForegroundColor Red
    exit 1
}

# Instructions for manual push
Write-Host "`nBuild successful!" -ForegroundColor Green
Write-Host "`nTo push to Railway, follow these steps:" -ForegroundColor Yellow
Write-Host "1. Log in to your Railway CLI (if not already):" -ForegroundColor White
Write-Host "   railway login" -ForegroundColor Gray
Write-Host "`n2. Link to your project:" -ForegroundColor White
Write-Host "   railway link" -ForegroundColor Gray
Write-Host "`n3. Get your project's image registry URL:" -ForegroundColor White
Write-Host "   railway variables get RAILWAY_CONTAINER_REGISTRY_HOST" -ForegroundColor Gray
Write-Host "`n4. Tag and push your image using:" -ForegroundColor White
Write-Host "   docker tag wallet-backend-railway [YOUR_REGISTRY_URL]/wallet-backend" -ForegroundColor Gray
Write-Host "   docker push [YOUR_REGISTRY_URL]/wallet-backend" -ForegroundColor Gray
