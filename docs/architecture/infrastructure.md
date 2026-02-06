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

### Variables d'Environnement

```bash
# .env.example

# Database
DATABASE_URL=postgresql://jdrai:jdrai@localhost:5432/jdrai

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars-change-in-production
BETTER_AUTH_URL=http://localhost:3000

# API
API_PORT=3000
API_URL=http://localhost:3000

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_PRIMARY_PROVIDER=openai

# Environment
NODE_ENV=development
```

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
