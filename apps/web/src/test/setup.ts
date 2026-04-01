import "@testing-library/jest-dom/vitest";

// Radix UI (Slider, etc.) uses ResizeObserver, which is not available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Radix UI DropdownMenu/Popover uses pointer capture APIs not present in jsdom
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
