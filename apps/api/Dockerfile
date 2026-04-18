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

# Remove devDependencies before copying to production stage
# CI=true required: pnpm refuses to delete node_modules without TTY otherwise
RUN CI=true pnpm prune --prod

# ── Production ──────────────────────────────────────────────────────────────────
FROM base AS production
WORKDIR /app

# Copy pnpm virtual store (root node_modules/.pnpm) + app-level symlinks
# pnpm splits installs: root has the virtual store, apps/api/node_modules has symlinks into it
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Compiled shared package — symlink @jdrai/shared resolves here
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
RUN printf '{"name":"@jdrai/shared","version":"0.0.0","type":"module","main":"./dist/index.js"}' \
    > ./packages/shared/package.json

# Compiled API + migrations
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/drizzle ./apps/api/drizzle
COPY --from=builder /app/apps/api/package.json ./apps/api/

WORKDIR /app/apps/api
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
