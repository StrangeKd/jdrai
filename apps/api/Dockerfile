FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── Build ───────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy manifests first so pnpm install is cached unless deps change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY . .

# Build shared first (api depends on it at compile time)
RUN pnpm --filter @jdrai/shared build
RUN pnpm --filter @jdrai/api build

# pnpm deploy creates a self-contained folder with real files (no symlinks, no virtual store)
# This is the recommended way to handle pnpm monorepos in Docker
RUN pnpm --filter @jdrai/api deploy --prod --legacy /deploy

# dist/ and drizzle/ are gitignored so pnpm deploy skips them — copy manually
# @jdrai/shared is bundled inline by tsup — no patching needed
RUN cp -r apps/api/dist /deploy/dist
RUN cp -r apps/api/drizzle /deploy/drizzle

# ── Production ──────────────────────────────────────────────────────────────────
FROM base AS production
WORKDIR /app

COPY --from=builder /deploy .

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
