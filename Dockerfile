# =============================================================================
# Multi-stage Dockerfile para Finanças 360°
# Backend: Bun + Express + TypeScript + Prisma
# Frontend: React + TypeScript + Vite
# =============================================================================

# =============================================================================
# Stage 1: Build Frontend
# =============================================================================
FROM oven/bun:1-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/bun.lockb* ./

RUN bun install --frozen-lockfile

COPY frontend/ ./

RUN bun run build

# =============================================================================
# Stage 2: Build Backend
# =============================================================================
FROM oven/bun:1-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package.json backend/bun.lockb* ./

RUN bun install --frozen-lockfile

COPY backend/ ./

RUN bunx prisma generate

# =============================================================================
# Stage 3: Production Runtime
# =============================================================================
FROM oven/bun:1-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/bun.lockb* ./backend/

WORKDIR /app/backend

RUN bun install --production --frozen-lockfile

COPY --from=backend-builder /app/backend/src ./src
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma

COPY --from=frontend-builder /app/frontend/dist ./public

RUN mkdir -p ./uploads

RUN printf '#!/bin/sh\nset -e\n\nif [ -z "$DATABASE_URL" ]; then\n  echo "ERROR: DATABASE_URL não definida"\n  exit 1\nfi\n\necho "Aplicando migrations..."\nbunx prisma migrate deploy\n\necho "Iniciando servidor..."\nexec bun src/index.ts\n' > /app/backend/start.sh && chmod +x /app/backend/start.sh

EXPOSE 5000

ENV NODE_ENV=production PORT=5000 CORS_ORIGIN=* JWT_EXPIRES_IN=7d JWT_REFRESH_EXPIRES_IN=30d

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD bun run -e "fetch('http://localhost:5000/health').then(r => r.status === 200 ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

USER bun

CMD ["/app/backend/start.sh"]
