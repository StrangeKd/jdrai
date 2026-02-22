# Infrastructure & Développement

---

## Workflow de Développement

### Prérequis

```bash
node >= 20.x
pnpm >= 9.x
docker >= 24.x
```

### Installation

```bash
# Clone et installation
git clone <repo>
cd jdrai
pnpm install

# Configuration environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Démarrer la base de données
docker compose up -d postgres

# Migrations
pnpm db:migrate

# Seeds (données de dev)
pnpm db:seed
```

### Commandes de Développement

```bash
# Démarrer tout (turbo)
pnpm dev

# Démarrer individuellement
pnpm dev --filter=web
pnpm dev --filter=api

# Build
pnpm build

# Tests
pnpm test
pnpm test:e2e

# Linting
pnpm lint
pnpm lint:fix

# Base de données
pnpm db:generate    # Générer migration depuis schema
pnpm db:migrate     # Appliquer migrations
pnpm db:push        # Push schema (dev only)
pnpm db:studio      # Drizzle Studio (GUI)
pnpm db:seed        # Seeder données

# Génération types partagés
pnpm shared:generate
```

### Configuration Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

### Proxy `/api/*` — Développement

Le frontend proxie toutes les requêtes `/api/*` vers le backend via Vite. Cela garantit que les cookies httpOnly Better Auth sont posés sur le domaine frontend (`:5173`) et non sur le backend (`:3000`).

```typescript
// apps/web/vite.config.ts — déjà configuré
server: {
  port: 5173,
  proxy: {
    "/api": {
      target: "http://localhost:3000",
      changeOrigin: true,
    },
  },
},
```

> **Règle critique** : ne jamais pointer `createAuthClient({ baseURL: "http://localhost:3000" })` directement. Le client doit utiliser `window.location.origin` (pas de `baseURL`) pour que le proxy fonctionne.

### Variables d'Environnement

```bash
# .env (racine du monorepo — chargé par l'API via dotenv)

# Database
DATABASE_URL=postgresql://jdrai:jdrai@localhost:5432/jdrai

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars-change-in-production
BETTER_AUTH_URL=http://localhost:3000   # URL interne du backend

# API
API_PORT=3000
API_URL=http://localhost:3000

# Frontend
FRONTEND_URL=http://localhost:5173     # Utilisé par CORS (trustedOrigins Better Auth)
VITE_API_URL=http://localhost:3000     # Utilisé par le service API custom (/api/v1/*)
                                       # NON utilisé par auth-client.ts (proxy)

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_PRIMARY_PROVIDER=openai

# Environment
NODE_ENV=development
```

> **`VITE_API_URL`** : chargé dans Vite via `envDir` pointant vers la racine (`apps/web/vite.config.ts`). Utilisé par le service API custom (`src/services/api.ts`) pour les appels `/api/v1/*`. L'auth Better Auth n'utilise pas cette variable — elle passe par le proxy.

---

## Docker

### Docker Compose (Développement)

```yaml
# docker/docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: jdrai-db
    environment:
      POSTGRES_USER: jdrai
      POSTGRES_PASSWORD: jdrai
      POSTGRES_DB: jdrai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jdrai"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: jdrai-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Reverse Proxy — Production

### Prérequis obligatoire : routage `/api/*`

En production, le frontend est servi en statique (CDN ou nginx) et le backend tourne sur un serveur séparé. **Le reverse proxy doit router `/api/*` vers le backend** — même principe que le proxy Vite en dev.

Sans ce routage, les cookies Better Auth seraient posés sur le domaine backend et inaccessibles au frontend → la session ne fonctionnerait pas.

### Configuration nginx (exemple)

```nginx
server {
  listen 443 ssl;
  server_name jdrai.app;

  # Frontend — fichiers statiques
  location / {
    root /var/www/jdrai/dist;
    try_files $uri $uri/ /index.html;
  }

  # Backend — toutes les requêtes API (Better Auth + routes custom)
  location /api/ {
    proxy_pass http://backend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Cookies — important pour Better Auth
    proxy_cookie_path / "/; SameSite=Lax; Secure";
  }

  # WebSocket — sessions de jeu (Socket.io, P1+)
  location /socket.io/ {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

> **Variables d'environnement production** à mettre à jour :
> - `BETTER_AUTH_URL` → URL publique du backend (ex: `https://api.jdrai.app`) ou URL interne si même domaine
> - `FRONTEND_URL` → URL publique du frontend (ex: `https://jdrai.app`) — utilisée dans `trustedOrigins`
> - `BETTER_AUTH_SECRET` → secret fort (32+ chars), différent du dev

### CDN (alternative nginx)

Si le frontend est hébergé sur Vercel/Netlify/Cloudflare :
- Configurer des **rewrites** : `/api/*` → `https://api.jdrai.app/api/*`
- Activer `credentials: true` dans les headers de rewrite
- Vérifier que `sameSite` et `secure` sont compatibles avec le CDN

---

## Sécurité

### Frontend

| Mesure          | Implémentation                                            |
| --------------- | --------------------------------------------------------- |
| XSS Prevention  | React échappe par défaut, CSP headers                     |
| Session Storage | Cookies httpOnly gérés par Better Auth (pas de JS access) |
| HTTPS           | Obligatoire en production                                 |
| CSRF            | Better Auth gère la protection CSRF automatiquement       |

### Backend

| Mesure           | Implémentation                           |
| ---------------- | ---------------------------------------- |
| Input Validation | Zod sur tous les endpoints               |
| SQL Injection    | Drizzle ORM (requêtes paramétrées)       |
| Rate Limiting    | express-rate-limit par IP/user           |
| CORS             | Whitelist origines autorisées            |
| Password Hashing | Better Auth (Argon2 par défaut)          |
| Sessions         | Better Auth (cookies httpOnly, rotation) |

### Headers de Sécurité

```typescript
// Helmet.js config
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.API_URL],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
```

---

## Monitoring (Post-MVP)

### Stack Recommandée

| Outil                    | Usage                         |
| ------------------------ | ----------------------------- |
| **Sentry**               | Error tracking (front + back) |
| **Prometheus + Grafana** | Métriques, dashboards         |
| **Winston**              | Logging structuré             |

### Métriques Clés

**Backend:**

- Request rate / latency
- Error rate par endpoint
- LLM response time / token usage
- Database query performance

**Frontend:**

- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors
- API response times
