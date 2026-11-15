#!/usr/bin/env bash
# ==============================================================================
# Learn LMS — Production Deployment & Migration Automation Script (POSIX)
# Product by ORELSE (https://www.orelse.ai)
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo " Starting Learn LMS Production Deployment Sequence"
echo "=========================================================="

# 1. Environment Verification
if [ ! -f .env.production ] && [ ! -f .env ]; then
  echo "❌ Error: Neither .env.production nor .env found."
  exit 1
fi

echo "1. Checking database readiness..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
  echo "❌ Error: Cannot connect to PostgreSQL database."
  exit 1
fi
echo "   ✅ Database connection verified."

# 2. Apply Version-Controlled Database Migrations
echo "2. Applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy
echo "   ✅ Migrations deployed cleanly."

# 3. Build Application Assets
echo "3. Compiling Next.js application (npm run build)..."
npm run build
echo "   ✅ Application compiled successfully."

# 4. Restart Application Service (Systemd / PM2 / Docker)
echo "4. Reloading application process..."
if command -v systemctl > /dev/null 2>&1 && systemctl is-active --quiet learnlms; then
  sudo systemctl reload-or-restart learnlms
elif command -v pm2 > /dev/null 2>&1; then
  pm2 reload learnlms --update-env || pm2 start npm --name "learnlms" -- start
else
  echo "   ℹ️ Process manager not detected. Manual restart required."
fi

# 5. Post-Deployment Health Check Verification
echo "5. Executing post-deployment health check..."
sleep 3
HEALTH_URL="http://127.0.0.1:3000/api/health/ready"

for i in {1..10}; do
  if curl -s -f "$HEALTH_URL" | grep -q '"status":"ready"'; then
    echo "   ✅ Health check passed: Application is READY."
    echo "=========================================================="
    echo " 🎉 DEPLOYMENT COMPLETED SUCCESSFULLY"
    echo "=========================================================="
    exit 0
  fi
  echo "   ...waiting for health endpoint (attempt $i/10)"
  sleep 2
done

echo "❌ Error: Health check timed out or failed. Check application logs."
exit 1
