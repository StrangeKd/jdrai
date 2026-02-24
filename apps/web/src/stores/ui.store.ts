import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      sidebarOpen: true,
      theme: "system",
      adventureModalOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      // adventureModalOpen is NOT persisted — always starts closed on page load
      setAdventureModalOpen: (open) => set({ adventureModalOpen: open }),
    }),
    {
      name: "jdrai-ui",
      partialize: (s) => ({ sidebarOpen: s.sidebarOpen, theme: s.theme }),
    },
  ),
);
