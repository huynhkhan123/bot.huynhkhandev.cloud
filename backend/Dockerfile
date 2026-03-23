# ── Build ──────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Force Prisma to use the binary engine (not data proxy/edge client)
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# Install dependencies
COPY package*.json ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./
RUN npm ci --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
COPY . .
RUN npm run build

# ── Production ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Ensure runtime also defaults to binary engine
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

RUN apk add --no-cache dumb-init postgresql-client

ENV NODE_ENV=production

# Copy built app + necessary files
COPY --from=builder /app/dist                  ./dist
COPY --from=builder /app/node_modules          ./node_modules
COPY --from=builder /app/package.json          ./package.json
COPY --from=builder /app/prisma                ./prisma
COPY --from=builder /app/prisma.config.ts      ./prisma.config.ts
# Include tsconfig files for ts-node (prisma seed) in runtime image
COPY --from=builder /app/tsconfig.json         ./tsconfig.json
COPY --from=builder /app/tsconfig.build.json   ./tsconfig.build.json

# Copy startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001

# dumb-init handles signal forwarding
ENTRYPOINT ["dumb-init", "--", "/docker-entrypoint.sh"]
