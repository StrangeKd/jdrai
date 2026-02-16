# JDRAI

Plateforme de jeu de rôle avec MJ IA (type D&D), solo ou multijoueur.

## Prérequis

- Node.js >= 20
- pnpm >= 9
- Docker + Docker Compose

## Installation

```bash
git clone <repo>
cd jdrai
pnpm install
cp .env.example .env
# Éditer .env avec vos valeurs (POSTGRES_PASSWORD, clés API...)
```

## Démarrage

```bash
# Démarrer PostgreSQL
pnpm docker:up

# Lancer l'environnement de développement
pnpm dev
```

## Arrêt

```bash
pnpm docker:down
```

## Reset de la base de données

```bash
pnpm docker:down:volumes
```

## Logs PostgreSQL

```bash
pnpm docker:logs
```

## Architecture

Voir [`docs/architecture/README.md`](docs/architecture/README.md) pour l'architecture complète.
