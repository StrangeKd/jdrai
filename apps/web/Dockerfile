FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy manifests first so pnpm install is cached unless deps change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY . .

# In production nginx proxies /api → api:3000, so VITE_API_URL stays empty
# Pass a non-empty value only if you serve the API on a separate domain
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @jdrai/web build

# ── Production (nginx) ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
