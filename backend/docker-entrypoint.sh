#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h "$POSTGRES_HOST" -U "$POSTGRES_USER" 2>/dev/null; do
  sleep 2
done

echo "📦 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Running seed (safe to re-run)..."
node -e "
  const { execSync } = require('child_process');
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' });
  } catch(e) {
    console.log('Seed skipped (already applied or error):', e.message);
  }
"

echo "🚀 Starting backend server..."
exec node dist/main
