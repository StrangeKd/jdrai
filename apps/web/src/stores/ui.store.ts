import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UIStore {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  adventureModalOpen: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: UIStore["theme"]) => void;
  setAdventureModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // TODO(Story 4.2 / Settings P2): wire this into `Sidebar` (collapse/expand) and persist the preference.
      sidebarOpen: true,
      // TODO(Settings P2): apply theme to the app root (light/dark/system) and persist preference.
      theme: "system",
      adventureModalOpen: false,
      // TODO(Story 4.2 / Settings P2): expose a real sidebar toggle control (tablet/desktop).
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      // TODO(Settings P2): provide UI to change theme.
      setTheme: (theme) => set({ theme }),
      // adventureModalOpen is NOT persisted — always starts closed on page load
      setAdventureModalOpen: (open) => set({ adventureModalOpen: open }),
    }),
    {
      name: "jdrai-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ sidebarOpen: s.sidebarOpen, theme: s.theme }),
      version: 1,
    },
  ),
);
