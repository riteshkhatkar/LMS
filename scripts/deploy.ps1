<#
.SYNOPSIS
    Learn LMS — Production Deployment Script for Windows Server / PowerShell
    Product by ORELSE (https://www.orelse.ai)
#>

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting Learn LMS Production Deployment Sequence" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Environment Verification
Write-Host "1. Verifying environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env") -and -not (Test-Path ".env.production")) {
    Write-Error "❌ Error: Neither .env nor .env.production file found."
    exit 1
}
Write-Host "   ✅ Environment files confirmed." -ForegroundColor Green

# 2. Database Migrations
Write-Host "2. Deploying version-controlled Prisma migrations..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error: Prisma migration failed."
    exit 1
}
Write-Host "   ✅ Database migrations applied cleanly." -ForegroundColor Green

# 3. Application Build
Write-Host "3. Compiling production Next.js build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error: Next.js build failed."
    exit 1
}
Write-Host "   ✅ Build succeeded." -ForegroundColor Green

# 4. Health Probe
Write-Host "4. Performing health check..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/api/health/ready" -Method Get -TimeoutSec 5
    if ($res.status -eq "ready") {
        Write-Host "   ✅ Application is READY and HEALTHY." -ForegroundColor Green
    } else {
        Write-Warning "   ⚠️ Warning: Health check returned non-ready status: $($res.status)"
    }
} catch {
    Write-Warning "   ℹ️ Health check endpoint not reachable immediately (ensure server is running)."
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🎉 DEPLOYMENT SEQUENCE FINISHED" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
