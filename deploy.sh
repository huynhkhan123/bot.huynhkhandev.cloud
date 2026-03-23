#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — One-command deployment for bot.huynhkhandev.cloud
# Usage: bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── 0. Load .env ─────────────────────────────────────────────────────────────
if [ ! -f "$ROOT/.env" ]; then
  echo "❌  .env file not found. Copy .env.example → .env and fill in secrets."
  exit 1
fi
set -a; source "$ROOT/.env"; set +a

echo "🚀  Deploying ${DOMAIN}..."

# ── 1. Ensure nginx conf uses the actual domain ──────────────────────────────
export NGINX_DOMAIN="$DOMAIN"

# ── 2. Process nginx.conf — substitute $DOMAIN ───────────────────────────────
envsubst '${NGINX_DOMAIN}' < "$ROOT/nginx/nginx.conf" > /tmp/nginx_final.conf
mkdir -p "$ROOT/nginx"
cp /tmp/nginx_final.conf "$ROOT/nginx/nginx.conf"

# ── 3. Pull / build all images ───────────────────────────────────────────────
echo "🔨  Building Docker images..."
docker compose --env-file "$ROOT/.env" build

# ── 4. First-time SSL bootstrap (HTTP-only nginx to get first cert) ───────────
if [ ! -d "$ROOT/nginx/ssl_bootstrap_done" ]; then
  echo "🔐  Bootstrapping SSL certificate for $DOMAIN..."

  # Start nginx in HTTP-only mode temporarily
  docker compose up -d nginx
  sleep 5

  # Issue certificate
  docker compose run --rm certbot certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$DOMAIN"

  # Mark bootstrap done
  mkdir -p "$ROOT/nginx/ssl_bootstrap_done"
  echo "  ✅ SSL certificate issued."
fi

# ── 5. Start all services ─────────────────────────────────────────────────────
echo "🚀  Starting all services..."
docker compose --env-file "$ROOT/.env" up -d

echo ""
echo "✅  Done! Your app is live at: https://${DOMAIN}"
echo ""
echo "   📋  Useful commands:"
echo "   docker compose logs -f backend   — backend logs"
echo "   docker compose logs -f frontend  — frontend logs"
echo "   docker compose logs -f nginx     — nginx logs"
echo "   docker compose restart backend   — restart backend"
echo "   docker compose down              — stop all"
