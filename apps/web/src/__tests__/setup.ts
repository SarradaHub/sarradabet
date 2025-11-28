import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";
import { vi } from "vitest";

// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_API_URL: "http://localhost:8000",
  },
});

// Mock fetch globally
if (!(global as any).fetch) {
  (global as any).fetch = vi.fn();
}

// Polyfill TextEncoder/TextDecoder for libs expecting Node encoders
if (!(global as any).TextEncoder) {
  (global as any).TextEncoder =
    TextEncoder as unknown as typeof globalThis.TextEncoder;
}
if (!(global as any).TextDecoder) {
  (global as any).TextDecoder =
    TextDecoder as unknown as typeof globalThis.TextDecoder;
}

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
