import "./index.css";
import "./lib/validation"; // global Zod error map (French messages)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { useAuth } from "./hooks/useAuth";
import { router } from "./router";

const queryClient = new QueryClient();

function App() {
  const auth = useAuth();

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
