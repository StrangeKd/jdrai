import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { AppConfig } from "@jdrai/shared";

// AppConfig imported to validate @jdrai/shared is resolvable from web — used in later stories
const _appConfig: AppConfig = { apiUrl: "/api", version: "0.0.0" };

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(
  <StrictMode>
    <div style={{ fontFamily: "sans-serif", textAlign: "center", paddingTop: "4rem" }}>
      <h1>JDRAI</h1>
      <p>Plateforme de jeu de rôle avec MJ IA</p>
    </div>
  </StrictMode>
);
