import "@testing-library/jest-dom/vitest";

// Radix UI (Slider, etc.) uses ResizeObserver, which is not available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
