import { toNodeHandler } from "better-auth/node";
import express, { type IRouter, Router } from "express";

import { auth } from "@/lib/auth";

import { v1Router } from "./v1.router";

export const apiRouter: IRouter = Router();

// ⚠️ CONTRAINTE CRITIQUE — NE PAS MODIFIER L'ORDRE
// Better Auth gère son propre body parsing via `toNodeHandler`.
// Si express.json() est placé avant ce handler, Better Auth ne peut plus
// lire le body des requêtes d'auth → toutes les routes /auth/* cassent silencieusement.
apiRouter.all("/auth/*", toNodeHandler(auth));

// JSON middleware pour toutes les routes versionnées
apiRouter.use(express.json());

// Routes versionnées — ajouter /v2 ici le moment venu sans toucher à app.ts
apiRouter.use("/v1", v1Router);

