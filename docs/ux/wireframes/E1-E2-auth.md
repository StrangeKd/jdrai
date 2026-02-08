# E1/E2 — Auth (+ E3/E4 mot de passe oublié)

**Routes :** `/auth/login` (E1), `/auth/register` (E2), `/auth/forgot-password` (E3), `/auth/reset-password/:token` (E4)
**Priorité :** P1
**Complexité :** Faible
**Référence composants :** UX Cartography §5.2
**Référence maquette :** `mockups/auth.png` (base fiable — adapter)
**Parent :** [`wireframes/README.md`](README.md)

---

## Table des matières

1. [Décisions spécifiques Auth](#1-décisions-spécifiques-auth)
2. [Anatomie des écrans](#2-anatomie-des-écrans)
3. [Wireframes mobile (< 768px)](#3-wireframes-mobile--768px)
4. [États d'erreur et edge cases](#4-états-derreur-et-edge-cases)
5. [Wireframes desktop (> 1024px)](#5-wireframes-desktop--1024px)
6. [Interactions et transitions](#6-interactions-et-transitions)
7. [Règles de comportement](#7-règles-de-comportement)

---

## 1. Décisions spécifiques Auth

| Décision               | Choix                          | Alternatives écartées                 | Raison                                                                                                                   |
| ---------------------- | ------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Layout                 | **AuthCard parchemin centrée** | Formulaire pleine page / split screen | Fidèle à la maquette existante (`auth.png`). Le parchemin centré sur fond atmosphérique pose l'ambiance dès l'arrivée.   |
| Pseudo à l'inscription | **Non (onboarding uniquement)**| Pseudo à l'inscription                | Le pseudo est collecté en onboarding (E6-01) où le joueur est déjà dans l'univers JDRAI. Séparer inscription et identité narrative. |
| Sidebar / Tab bar      | **Masquées**                   | Visibles                              | Pas de navigation avant l'authentification (cf. UX Cartography §3.2).                                                    |
| Fond                   | **Illustration dark fantasy**  | Fond uni sombre                       | La maquette existante utilise un fond atmosphérique qui renforce l'immersion dès le premier écran.                       |
| Auth provider          | **Email + mot de passe (P1)**  | OAuth (Google, Discord)               | Better Auth supporte OAuth, mais en P1 seul email/password est implémenté. Espace réservé pour les boutons OAuth en P2+. |
| Onboarding redirect    | **Register → Onboarding (E5)** | Register → Hub                        | Les nouveaux joueurs passent systématiquement par l'onboarding. Login → Hub (ou onboarding si pas complété).             |
| Vérification email     | **Non-bloquante (P1)**         | Bloquante (vérif avant onboarding) / Aucune | Better Auth envoie un email de vérification à l'inscription (`sendOnSignUp: true`), mais le joueur accède directement à l'onboarding sans attendre. Bandeau rappel dans le Hub (E8) tant que l'email n'est pas vérifié. Priorité à l'immersion narrative dès la première session. |
---

## 2. Anatomie des écrans

### 2.1 E1 — Login

```
┌─────────────────────────────────┐
│                                 │
│  (fond atmosphérique)           │
│                                 │
│  ┌─────────────────────────┐    │
│  │  JDRAI (logo)           │    │ ← AuthCard (parchemin)
│  │                         │    │
│  │  [Input email]          │    │
│  │  [Input password]       │    │
│  │  Mot de passe oublié ?  │    │
│  │                         │    │
│  │  [CTA Connexion]        │    │
│  │                         │    │
│  │  Pas de compte ?        │    │
│  │  S'inscrire             │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

**Composants :** AuthCard, Input texte, Input password, Lien inline, Bouton primaire

### 2.2 E2 — Register

```
┌─────────────────────────────────┐
│                                 │
│  (fond atmosphérique)           │
│                                 │
│  ┌─────────────────────────┐    │
│  │  JDRAI (logo)           │    │ ← AuthCard (parchemin)
│  │                         │    │ ← Pas d'input pseudo, cf. WF-E6-01 (choix du pseudo)
│  │  [Input email]          │    │
│  │  [Input password]       │    │
│  │  [Input confirm pwd]    │    │
│  │                         │    │
│  │  [CTA S'inscrire]       │    │
│  │                         │    │
│  │  ── ou ──               │    │ ← Séparateur (P2+ : OAuth)
│  │  (espace réservé OAuth) │    │
│  │                         │    │
│  │  Déjà un compte ?       │    │
│  │  Se connecter           │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

**Composants :** AuthCard, Input texte, Input password (x2), Séparateur, Lien inline, Bouton primaire

### 2.3 E3 — Mot de passe oublié

```
┌─────────────────────────────────┐
│                                 │
│  ┌─────────────────────────┐    │
│  │  JDRAI (logo)           │    │
│  │                         │    │
│  │  Mot de passe oublié    │    │
│  │                         │    │
│  │  [Input email]          │    │
│  │                         │    │
│  │  [CTA Envoyer le lien]  │    │
│  │                         │    │
│  │  Retour à la connexion  │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

### 2.4 E4 — Réinitialisation mot de passe

```
┌─────────────────────────────────┐
│                                 │
│  ┌─────────────────────────┐    │
│  │  JDRAI (logo)           │    │
│  │                         │    │
│  │  Nouveau mot de passe   │    │
│  │                         │    │
│  │  [Input password]       │    │
│  │  [Input confirm pwd]    │    │
│  │                         │    │
│  │  [CTA Réinitialiser]    │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## 3. Wireframes mobile (< 768px)

### WF-E1-01 — Login

```
┌─────────────────────────────────────┐
│                                     │
│  (fond dark fantasy, flou léger)    │
│                                     │
│                                     │
│     ┌───────────────────────┐       │
│     │                       │       │
│     │     ╔═══════════╗     │       │ ← Logo JDRAI
│     │     ║   JDRAI   ║     │       │   style fantasy / doré
│     │     ╚═══════════╝     │       │
│     │                       │       │
│     │  Email                │       │
│     │  ┌───────────────────┐│       │
│     │  │                   ││       │ ← Input texte
│     │  └───────────────────┘│       │   label flottant
│     │                       │       │
│     │  Mot de passe         │       │
│     │  ┌───────────────────┐│       │
│     │  │               [👁]││       │ ← Input password
│     │  └───────────────────┘│       │   toggle visibilité
│     │                       │       │
│     │  Mot de passe oublié ?│       │ ← Lien inline → E3
│     │                       │       │
│     │  ┌───────────────────┐│       │
│     │  │    CONNEXION      ││       │ ← CTA primaire
│     │  └───────────────────┘│       │
│     │                       │       │
│     │  ── ou ──             │       │ ← Séparateur
│     │  (P2+ : boutons OAuth)│       │   espace réservé
│     │                       │       │
│     │  Pas de compte ?      │       │
│     │  S'inscrire           │       │ ← Lien → E2
│     │                       │       │
│     └───────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- L'AuthCard est centrée verticalement sur l'écran
- Le fond atmosphérique (dark fantasy) est visible autour de la carte
- Le toggle visibilité du mot de passe (👁) est à droite dans l'input
- L'espace OAuth sous le séparateur est **vide en P1** — les boutons OAuth (Google, Discord) seront ajoutés en P2+
- L'input email a le `type="email"` pour le clavier adapté sur mobile

### WF-E2-01 — Register

```
┌─────────────────────────────────────┐
│                                     │
│  (fond dark fantasy, flou léger)    │
│                                     │
│     ┌───────────────────────┐       │
│     │                       │       │
│     │     ╔═══════════╗     │       │
│     │     ║   JDRAI   ║     │       │
│     │     ╚═══════════╝     │       │
│     │                       │       │
│     │  Email                │       │
│     │  ┌───────────────────┐│       │
│     │  │                   ││       │ ← Input email
│     │  └───────────────────┘│       │
│     │                       │       │
│     │  Mot de passe         │       │
│     │  ┌───────────────────┐│       │
│     │  │               [👁]││       │ ← Input password
│     │  └───────────────────┘│       │
│     │  Min. 8 caractères    │       │ ← Indicateur force
│     │                       │       │
│     │  Confirmer            │       │
│     │  ┌───────────────────┐│       │
│     │  │               [👁]││       │ ← Input confirm
│     │  └───────────────────┘│       │
│     │                       │       │
│     │  ┌───────────────────┐│       │
│     │  │    S'INSCRIRE     ││       │ ← CTA primaire
│     │  └───────────────────┘│       │
│     │                       │       │
│     │  ── ou ──             │       │
│     │  (P2+ : boutons OAuth)│       │
│     │                       │       │
│     │  Déjà un compte ?     │       │
│     │  Se connecter         │       │ ← Lien → E1
│     │                       │       │
│     └───────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Pas de champ pseudo — le pseudo est collecté en onboarding (E6-01)
- L'indicateur de force du mot de passe est textuel en P1 ("Min. 8 caractères"), potentiellement visuel en P2+ (barre de force)
- Le formulaire est plus long que le login — sur petits écrans, l'AuthCard scrolle verticalement

### WF-E3-01 — Mot de passe oublié (demande)

```
┌─────────────────────────────────────┐
│                                     │
│  (fond dark fantasy)                │
│                                     │
│     ┌───────────────────────┐       │
│     │                       │       │
│     │     ╔═══════════╗     │       │
│     │     ║   JDRAI   ║     │       │
│     │     ╚═══════════╝     │       │
│     │                       │       │
│     │  Mot de passe oublié  │       │ ← Titre
│     │                       │       │
│     │  Entrez votre email   │       │
│     │  pour recevoir un     │       │ ← Description courte
│     │  lien de réinit.      │       │
│     │                       │       │
│     │  Email                │       │
│     │  ┌───────────────────┐│       │
│     │  │                   ││       │
│     │  └───────────────────┘│       │
│     │                       │       │
│     │  ┌───────────────────┐│       │
│     │  │  ENVOYER LE LIEN  ││       │ ← CTA primaire
│     │  └───────────────────┘│       │
│     │                       │       │
│     │  Retour à la connexion│       │ ← Lien → E1
│     │                       │       │
│     └───────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

### WF-E3-02 — Confirmation envoi email

```
┌─────────────────────────────────────┐
│                                     │
│  (fond dark fantasy)                │
│                                     │
│     ┌───────────────────────┐       │
│     │                       │       │
│     │     ╔═══════════╗     │       │
│     │     ║   JDRAI   ║     │       │
│     │     ╚═══════════╝     │       │
│     │                       │       │
│     │         ✉️             │       │ ← Icône
│     │                       │       │
│     │  Email envoyé !       │       │ ← Titre confirmation
│     │                       │       │
│     │  Si un compte existe  │       │
│     │  avec cette adresse,  │       │ ← Message volontairement
│     │  vous recevrez un     │       │   ambigu (sécurité :
│     │  lien sous peu.       │       │   pas de confirmation
│     │                       │       │   d'existence du compte)
│     │  Pensez à vérifier    │       │
│     │  vos spams.           │       │
│     │                       │       │
│     │  Retour à la connexion│       │ ← Lien → E1
│     │                       │       │
│     └───────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

### WF-E4-01 — Réinitialisation mot de passe

```
┌─────────────────────────────────────┐
│                                     │
│  (fond dark fantasy)                │
│                                     │
│     ┌───────────────────────┐       │
│     │                       │       │
│     │     ╔═══════════╗     │       │
│     │     ║   JDRAI   ║     │       │
│     │     ╚═══════════╝     │       │
│     │                       │       │
│     │  Nouveau mot de passe │       │ ← Titre
│     │                       │       │
│     │  Mot de passe         │       │
│     │  ┌───────────────────┐│       │
│     │  │               [👁]││       │
│     │  └───────────────────┘│       │
│     │  Min. 8 caractères    │       │
│     │                       │       │
│     │  Confirmer            │       │
│     │  ┌───────────────────┐│       │
│     │  │               [👁]││       │
│     │  └───────────────────┘│       │
│     │                       │       │
│     │  ┌───────────────────┐│       │
│     │  │  RÉINITIALISER    ││       │ ← CTA primaire
│     │  └───────────────────┘│       │
│     │                       │       │
│     └───────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- L'accès se fait via un lien unique envoyé par email (token dans l'URL)
- Après réinitialisation réussie → redirect vers E1 (login) avec toast "Mot de passe modifié"
- Si le token est expiré ou invalide → WF-AUTH-03

---

## 4. États d'erreur et edge cases

### WF-AUTH-01 — Erreurs de validation (inline)

```
┌─────────────────────────────────────┐
│                                     │
│     ┌───────────────────────┐       │
│     │                       │       │
│     │     ╔═══════════╗     │       │
│     │     ║   JDRAI   ║     │       │
│     │     ╚═══════════╝     │       │
│     │                       │       │
│     │  Email                │       │
│     │  ┌───────────────────┐│       │
│     │  │ pas-un-email      ││       │
│     │  └───────────────────┘│       │
│     │  ⚠️ Adresse invalide   │       │ ← Erreur inline
│     │                       │       │
│     │  Mot de passe         │       │
│     │  ┌───────────────────┐│       │
│     │  │ ••••               ││       │
│     │  └───────────────────┘│       │
│     │  ⚠️ Min. 8 caractères  │       │ ← Erreur inline
│     │                       │       │
│     │  ┌───────────────────┐│       │
│     │  │    S'INSCRIRE     ││       │ ← Désactivé tant que
│     │  └───────────────────┘│       │   des erreurs persistent
│     │                       │       │
│     └───────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Validation côté client en temps réel (on blur + on submit)
- Les erreurs apparaissent sous le champ concerné, en rouge
- Le CTA reste **cliquable** mais déclenche la validation de tous les champs si des erreurs subsistent
- Erreurs possibles :
  - Email : format invalide, déjà utilisé (serveur)
  - Password : trop court (< 8)
  - Confirm : ne correspond pas

### WF-AUTH-02 — Erreur de connexion (login)

```
┌─────────────────────────────────────┐
│                                     │
│     ┌───────────────────────┐       │
│     │                       │       │
│     │     ╔═══════════╗     │       │
│     │     ║   JDRAI   ║     │       │
│     │     ╚═══════════╝     │       │
│     │                       │       │
│     │  ┌─────────────────┐  │       │
│     │  │ ⚠️ Identifiants  │  │       │ ← Erreur globale
│     │  │ incorrects.     │  │       │   (au-dessus du form)
│     │  └─────────────────┘  │       │   message générique
│     │                       │       │   (sécurité : ne pas
│     │  Email                │       │   révéler si l'email
│     │  ┌───────────────────┐│       │   existe ou non)
│     │  │ user@example.com  ││       │
│     │  └───────────────────┘│       │
│     │                       │       │
│     │  Mot de passe         │       │
│     │  ┌───────────────────┐│       │
│     │  │ ••••••••          ││       │
│     │  └───────────────────┘│       │
│     │                       │       │
│     │  Mot de passe oublié ?│       │
│     │                       │       │
│     │  ┌───────────────────┐│       │
│     │  │    CONNEXION      ││       │ ← CTA reste actif
│     │  └───────────────────┘│       │
│     │                       │       │
│     └───────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Message générique "Identifiants incorrects" — ne pas révéler si l'email existe ou non (sécurité)
- Le CTA reste actif pour permettre un nouveau essai
- Après 5 tentatives échouées, afficher un captcha ou un délai de cooldown (à définir en architecture)

### WF-AUTH-03 — Token expiré / invalide (E4)

```
┌─────────────────────────────────────┐
│                                     │
│     ┌───────────────────────┐       │
│     │                       │       │
│     │     ╔═══════════╗     │       │
│     │     ║   JDRAI   ║     │       │
│     │     ╚═══════════╝     │       │
│     │                       │       │
│     │         ⚠️             │       │
│     │                       │       │
│     │  Ce lien a expiré     │       │ ← Message clair
│     │  ou n'est plus valide.│       │
│     │                       │       │
│     │  ┌───────────────────┐│       │
│     │  │  RENVOYER UN LIEN ││       │ ← CTA → E3 (pré-rempli
│     │  └───────────────────┘│       │   si email connu)
│     │                       │       │
│     │  Retour à la connexion│       │ ← Lien → E1
│     │                       │       │
│     └───────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

---

## 5. Wireframes desktop (> 1024px)

### WF-AUTH-05 — Login desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  (fond dark fantasy — illustration pleine largeur, flou léger)               │
│                                                                              │
│                                                                              │
│                                                                              │
│                    ┌─────────────────────────────────┐                       │
│                    │                                 │                       │
│                    │      ╔═══════════════╗          │                       │
│                    │      ║     JDRAI     ║          │                       │
│                    │      ╚═══════════════╝          │                       │
│                    │                                 │                       │
│                    │  Email                          │                       │
│                    │  ┌─────────────────────────┐    │                       │
│                    │  │                         │    │                       │
│                    │  └─────────────────────────┘    │                       │
│                    │                                 │                       │
│                    │  Mot de passe                   │                       │
│                    │  ┌─────────────────────────┐    │                       │
│                    │  │                     [👁]│    │                       │
│                    │  └─────────────────────────┘    │                       │
│                    │                                 │                       │
│                    │  Mot de passe oublié ?          │                       │
│                    │                                 │                       │
│                    │  ┌─────────────────────────┐    │                       │
│                    │  │       CONNEXION         │    │                       │
│                    │  └─────────────────────────┘    │                       │
│                    │                                 │                       │
│                    │  ── ou ──                       │                       │
│                    │  (P2+ : boutons OAuth)          │                       │
│                    │                                 │                       │
│                    │  Pas de compte ? S'inscrire     │                       │
│                    │                                 │                       │
│                    └─────────────────────────────────┘                       │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Notes :**

- Pas de sidebar (navigation masquée avant auth)
- AuthCard centrée avec `max-width: ~420px` — fidèle à la maquette existante
- Le fond atmosphérique occupe tout l'écran, la carte "flotte" par-dessus
- Le register desktop suit le même pattern (carte centrée, plus longue)
- E3 et E4 desktop : identique au mobile dans une carte centrée (contenus courts)

---

## 6. Interactions et transitions

### Flow global

```
                          ┌──────────────────┐
                          │                  │
                    ┌─────┤  E1 — Login      ├─────┐
                    │     │                  │     │
                    │     └────────┬─────────┘     │
                    │              │                │
             [Pas de compte ?]    │         [Mot de passe
                    │             │          oublié ?]
                    ▼             │                │
          ┌─────────────────┐    │     ┌──────────▼───────┐
          │  E2 — Register  │    │     │  E3 — Forgot pwd │
          └────────┬────────┘    │     └──────────┬───────┘
                   │             │                │
            [S'inscrire]         │         [Envoyer lien]
                   │             │                │
                   ▼             │                ▼
          ┌─────────────────┐   │     ┌──────────────────┐
          │  Onboarding (E5)│   │     │  WF-E3-02 Conf.  │
          └─────────────────┘   │     └──────────────────┘
                                │                │
                         [Connexion]       (email reçu)
                                │                │
                                ▼                ▼
                       ┌────────────────┐  ┌───────────────┐
                       │  Hub (E8)      │  │ E4 — Reset pwd│
                       │  ou Onboarding │  └───────┬───────┘
                       │  (si pas fait) │          │
                       └────────────────┘   [Réinitialiser]
                                                   │
                                                   ▼
                                            E1 (Login)
                                            + toast succès
```

### Détail des interactions

| Action utilisateur                                       | Résultat                                                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Saisie email + password + tap "Connexion" (E1)           | Spinner sur le bouton. Succès → redirect Hub (E8). Exception : si pseudo absent côté serveur → Onboarding (E5). Erreur → WF-AUTH-02. |
| Tap "Pas de compte ? S'inscrire" (E1)                    | Navigation vers E2.                                                                                |
| Tap "Mot de passe oublié ?" (E1)                         | Navigation vers E3.                                                                                |
| Remplissage formulaire + tap "S'inscrire" (E2)           | Spinner sur le bouton. Succès → redirect Onboarding (E5). Erreur → erreurs inline (WF-AUTH-01).    |
| Tap "Déjà un compte ? Se connecter" (E2)                 | Navigation vers E1.                                                                                |
| Saisie email + tap "Envoyer le lien" (E3)                | Spinner → WF-E3-02 (confirmation). Même écran que l'email existe ou non (sécurité).                |
| Tap "Retour à la connexion" (E3)                         | Navigation vers E1.                                                                                |
| Saisie new password + confirm + tap "Réinitialiser" (E4) | Spinner. Succès → redirect E1 + toast "Mot de passe modifié". Token invalide → WF-AUTH-03.         |
| Tap "Renvoyer un lien" (WF-AUTH-03)                      | Navigation vers E3 (pré-rempli si email connu).                                                    |

---

## 7. Règles de comportement

| Règle                       | Description                                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentification**        | Better Auth, cookies httpOnly. Pas de JWT côté client. Session gérée côté serveur.                                                                                                        |
| **Pseudo**                  | Pas de pseudo à l'inscription. Le pseudo est collecté en onboarding (E6-01), dans le contexte narratif de JDRAI.                                                                          |
| **Email**                   | Format validé côté client. Unicité vérifiée côté serveur. Message d'erreur générique pour ne pas révéler l'existence d'un compte.                                                         |
| **Mot de passe**            | Min. 8 caractères (P1). Indicateur de force visuel en P2+. Toggle visibilité sur tous les champs password.                                                                                |
| **Redirect après login**    | Toujours → Hub (E8). Exception : si le pseudo est absent dans les données User (compte sans onboarding complété) → Onboarding (E5).                                                      |
| **Redirect après register** | Toujours → Onboarding (E5).                                                                                                                                                               |
| **Forgot password**         | Le message de confirmation est toujours le même, que l'email existe ou non (sécurité — pas d'énumération de comptes).                                                                     |
| **Token reset**             | Expiration configurable (suggestion : 1h). Après expiration → WF-AUTH-03 avec option de renvoi.                                                                                           |
| **Brute force**             | Après 5 tentatives de login échouées, introduire un délai progressif ou captcha. Détail à définir en architecture.                                                                        |
| **OAuth (P2+)**             | Espace réservé sous le séparateur pour les boutons OAuth (Google, Discord). En P1, le séparateur et l'espace sont **masqués** (pas d'espace vide visible).                                |
| **Vérification email**      | Non-bloquante. Better Auth envoie un email de vérification à l'inscription (`sendOnSignUp: true`). Le joueur accède directement à l'onboarding (E5) sans attendre la vérification. Bandeau rappel dans le Hub (E8, WF-E8-08) tant que l'email n'est pas vérifié. Le lien de vérification expire après 1h (configurable). Après clic sur le lien → page de succès minimaliste + redirect Hub. |
| **Compagnon (P3)**          | Pas d'intervention du compagnon sur les écrans d'auth. Le compagnon n'apparaît qu'après l'authentification.                                                                               |

---

**Document généré via BMAD Method — Phase UX Phase 2 (Sally, UX Expert)**
