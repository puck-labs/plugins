/**
 * Test setup file for Vitest
 * Configures jsdom environment and jest-dom matchers
 */

import "@testing-library/jest-dom/vitest";

// Jsdom environment is configured via vitest.config.ts
// This file imports custom matchers for better assertions

// Polyfill ResizeObserver for @dnd-kit/dom (used by @measured/puck)
// JSDOM doesn't provide ResizeObserver, but it's required by Puck's internals
global.ResizeObserver = class ResizeObserver {
  observe() {
    /* Intentionally empty - JSDOM polyfill for Puck's drag-and-drop */
  }
  unobserve() {
    /* Intentionally empty - JSDOM polyfill for Puck's drag-and-drop */
  }
  disconnect() {
    /* Intentionally empty - JSDOM polyfill for Puck's drag-and-drop */
  }
};
