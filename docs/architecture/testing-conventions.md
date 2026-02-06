# Tests & Conventions de Code

---

## Tests

### Stratégie

```
                    E2E (Playwright)
                   /                \
           Integration Tests (API)
          /                        \
    Unit Frontend (Vitest)    Unit Backend (Vitest)
```

### Structure

```
apps/
├── web/
│   └── tests/
│       ├── unit/           # Composants, hooks
│       └── e2e/            # Parcours utilisateur
└── api/
    └── tests/
        ├── unit/           # Services, utils
        └── integration/    # Routes API
```

### Exemple Test API

```typescript
// apps/api/tests/integration/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { db } from "../../src/db";

describe("POST /api/auth/sign-up/email", () => {
  it("should create a new user", async () => {
    const response = await request(app).post("/api/auth/sign-up/email").send({
      email: "test@example.com",
      name: "testuser",
      username: "testuser",
      password: "SecurePass123!",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("test@example.com");
    // Vérifie que le cookie de session est défini
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("should reject duplicate email", async () => {
    // First registration
    await request(app).post("/api/auth/sign-up/email").send({
      email: "duplicate@example.com",
      name: "user1",
      username: "user1",
      password: "SecurePass123!",
    });

    // Second registration with same email
    const response = await request(app).post("/api/auth/sign-up/email").send({
      email: "duplicate@example.com",
      name: "user2",
      username: "user2",
      password: "SecurePass123!",
    });

    expect(response.status).toBe(422); // Better Auth retourne 422 pour les conflits
  });
});
```

---

## Conventions de Code

### Règles Critiques

| Règle              | Description                                           |
| ------------------ | ----------------------------------------------------- |
| **Type Sharing**   | Toujours définir les types API dans `packages/shared` |
| **API Calls**      | Utiliser le service layer, jamais fetch direct        |
| **Env Variables**  | Accès via config objects uniquement                   |
| **Error Handling** | Utiliser le middleware d'erreur standard              |
| **Validation**     | Zod obligatoire sur tous les inputs API               |

### Naming Conventions

| Élément              | Convention           | Exemple                |
| -------------------- | -------------------- | ---------------------- |
| Composants React     | PascalCase           | `UserProfile.tsx`      |
| Hooks                | camelCase + use      | `useAuth.ts`           |
| Services             | camelCase + .service | `auth.service.ts`      |
| Routes API           | kebab-case           | `/meta-character`      |
| Tables DB            | snake_case           | `adventure_characters` |
| Fichiers TS généraux | camelCase            | `gameUtils.ts`         |
