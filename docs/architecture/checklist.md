# Checklist de Validation

---

**Infrastructure :**

- [ ] Structure monorepo correcte (turbo + pnpm)
- [ ] Types partagés dans `packages/shared`
- [ ] Drizzle configuré avec migrations
- [ ] Docker compose fonctionnel
- [ ] Variables d'environnement documentées
- [ ] CI/CD configuré

**Backend :**

- [ ] Auth Better Auth fonctionnelle
- [ ] Routes protégées (front + back)
- [ ] Validation Zod sur tous les endpoints
- [ ] Error handling unifié
- [ ] Tests de base en place

**Frontend P1 :**

- [ ] Routes onboarding détaillées (welcome, profile-setup, tutorial)
- [ ] Route `/adventure/:id/summary` (écran de fin)
- [ ] Navigation masquée en session de jeu (menu intégré + confirmation sortie)
- [ ] Bottom Tab Bar mobile (`components/layout/BottomTabBar`)
- [ ] Breakpoints responsive (mobile / tablette / desktop)
- [ ] Intercepteur 429 dans le client API
- [ ] Reconnexion UX en session (composant toast/banner)
- [ ] Structure `components/` alignée avec inventaire UX Cartography

**Frontend P2 :**

- [ ] Route `/profile` (méta-personnage)
- [ ] Page `/settings` (compte + préférences)
- [ ] Panneau paramètres MJ en session
- [ ] Endpoint + bouton « MJ bloqué » (reset-context)

**Anticipations P3 :**

- [ ] Dossier `companion/` créé (placeholder vide)
- [ ] Routes multijoueur commentées dans l'arbre
- [ ] Détection double onglet documentée
