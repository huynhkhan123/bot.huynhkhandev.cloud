#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# setup.sh — Auto-generate .env for bot.huynhkhandev.cloud
# Run once before deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -eo pipefail    # Note: no -u, to allow optional $2 in ask()
ROOT="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$ROOT/.env"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║        BotCloud — Initial Setup                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Already configured? ───────────────────────────────────────────────────────
if [ -f "$ENV_FILE" ] && grep -q "AZURE_COMMUNICATION_CONNECTION_STRING=endpoint" "$ENV_FILE" 2>/dev/null; then
  echo "✅  .env already configured. Run 'bash deploy.sh' to start."
  exit 0
fi

# ── Helper: prompt with default ───────────────────────────────────────────────
ask() {
  local prompt="$1"
  local default="${2:-}"   # ${2:-} prevents unbound variable error
  local value
  if [ -n "$default" ]; then
    read -rp "  $prompt [$default]: " value
    echo "${value:-$default}"
  else
    while true; do
      read -rp "  $prompt: " value
      [ -n "$value" ] && break
      echo "  ⚠️  This field is required." >&2
    done
    echo "$value"
  fi
}

# ── Collect required inputs ───────────────────────────────────────────────────
echo "📝  Please provide the following values:"
echo "    (Press Enter to use the default where shown)"
echo ""

DOMAIN=$(ask "Domain" "bot.huynhkhandev.cloud")
CERTBOT_EMAIL=$(ask "Email for SSL certificate (Let's Encrypt)")
GEMINI_API_KEY=$(ask "Gemini API key (from aistudio.google.com)")

echo ""
read -rp "  Do you have an OpenAI API key? (y/n) [n]: " HAS_OPENAI
HAS_OPENAI="${HAS_OPENAI:-n}"
if [[ "$HAS_OPENAI" =~ ^[Yy]$ ]]; then
  OPENAI_API_KEY=$(ask "OpenAI API key")
else
  OPENAI_API_KEY="OPENAI_NOT_CONFIGURED"
fi

echo ""
echo "  🔴  Redis Cloud"
REDIS_URL=$(ask "Redis URL (redis://default:password@host:port)")

echo ""
echo "  📧  Azure Email Communication Service"
echo "      (Find in Azure Portal → Communication Services → Keys)"
AZURE_COMMUNICATION_CONNECTION_STRING=$(ask "Azure connection string (endpoint=https://...;accesskey=...)")

# ── Auto-generate all secrets ─────────────────────────────────────────────────
echo ""
echo "🔐  Generating secure random secrets..."
JWT_ACCESS_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -dc 'a-zA-Z0-9' | head -c 20)

# ── Write .env ────────────────────────────────────────────────────────────────
cat > "$ENV_FILE" <<EOF
# ─── DATABASE ─────────────────────────────────────────────────────────────────
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=botdb

# ─── SEED ─────────────────────────────────────────────────────────────────────
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# ─── JWT SECRETS (auto-generated) ─────────────────────────────────────────────
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── AI PROVIDERS ─────────────────────────────────────────────────────────────
GEMINI_API_KEY=${GEMINI_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}

# ─── REDIS (Redis Cloud) ──────────────────────────────────────────────────────
REDIS_URL=${REDIS_URL}

# ─── EMAIL (Azure Communication Services) ─────────────────────────────────────
AZURE_COMMUNICATION_CONNECTION_STRING=${AZURE_COMMUNICATION_CONNECTION_STRING}
MAIL_FROM=noreply@huynhkhandev.cloud

# ─── DOMAIN ───────────────────────────────────────────────────────────────────
DOMAIN=${DOMAIN}
CERTBOT_EMAIL=${CERTBOT_EMAIL}

# ─── APP ──────────────────────────────────────────────────────────────────────
NODE_ENV=production
FRONTEND_URL=https://${DOMAIN}
COOKIE_DOMAIN=${DOMAIN}
EOF

echo ""
echo "✅  .env generated successfully!"
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ⚠️   SAVE THESE CREDENTIALS — shown only once!      ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Admin email : admin@${DOMAIN}"
echo "║  Admin pass  : ${ADMIN_PASSWORD}"
echo "║  DB password : ${POSTGRES_PASSWORD}"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "🚀  Now run:  bash deploy.sh"
echo ""
