# Tests

---

## Coding Conventions (Frontend)

### Validation / Zod

Always import `z` from `@/lib/validation` (never directly from `zod`) and use `fields.*` helpers when applicable.

`apps/web/src/lib/validation.ts` configures a global French error map and exposes reusable field validators:

```typescript
import { z, fields } from "@/lib/validation";

// Use fields.* for standard inputs
const schema = z.object({
  email: fields.email(),             // "Adresse email invalide"
  password: fields.password(8),      // min 8 chars
  username: fields.requiredString(30), // required, max 30
  bio: fields.optionalString(),      // optional
});
```

**Exception:** search params schemas using `z.preprocess`, `z.enum`, or `z.catch` may import `z` directly if not covered by `fields`.

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

