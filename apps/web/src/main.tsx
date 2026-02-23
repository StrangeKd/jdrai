import "./index.css";
import "./lib/validation"; // global Zod error map (French messages)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { useAuth } from "./hooks/useAuth";
import { router } from "./router";

const queryClient = new QueryClient();

function App() {
  const auth = useAuth();

  // Force re-evaluation of all route beforeLoad guards when auth state changes.
  // Required because beforeLoad runs on navigation only, not on reactive state changes.
  // username is included so the guard in _authenticated.tsx sees the updated value
  // after onboarding profile setup (isAuthenticated/isLoading don't change in that case).
  useEffect(() => {
    void router.invalidate();
  }, [auth.isAuthenticated, auth.isLoading, auth.user?.username]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ queryClient, auth }} />
    </QueryClientProvider>
  );
}

const rootElement = document.getElementById("root")!;
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
