import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder
if (typeof TextEncoder === 'undefined') {
  (globalThis as any).TextEncoder = class TextEncoder {
    encode(input: string): Uint8Array {
      const encoder = new TextEncoder();
      return encoder.encode(input);
    }
  };
}

if (typeof TextDecoder === 'undefined') {
  (globalThis as any).TextDecoder = class TextDecoder {
    decode(input: Uint8Array): string {
      const decoder = new TextDecoder();
      return decoder.decode(input);
    }
  };
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
delete (window as any).location;
(window as any).location = {
  href: 'http://localhost:3000',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Mock console methods to avoid noise in tests
const originalConsole = console;
(globalThis as any).console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
