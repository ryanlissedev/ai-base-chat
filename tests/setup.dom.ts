import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Ensure test environment flag
process.env.NODE_ENV = 'test';

// Mock Next.js router/navigation used by components
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// DOM-related mocks and shims
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// IntersectionObserver mock
// @ts-expect-error attach to global
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ResizeObserver mock
// @ts-expect-error attach to global
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Clipboard API mock for user-event clipboard interactions
// Ensure navigator.clipboard exists
if (!('clipboard' in navigator)) {
  // @ts-expect-error - define clipboard
  navigator.clipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  } as unknown as Clipboard;
} else {
  // @ts-expect-error - patch clipboard
  navigator.clipboard.writeText = navigator.clipboard.writeText || vi.fn().mockResolvedValue(undefined);
  // @ts-expect-error - patch clipboard
  navigator.clipboard.readText = navigator.clipboard.readText || vi.fn().mockResolvedValue('');
}

// Common DOM helpers used in tests and components
// @ts-expect-error - jsdom sometimes lacks scrollTo
window.scrollTo = window.scrollTo || vi.fn();
// @ts-expect-error - optional helper
HTMLElement.prototype.scrollIntoView = HTMLElement.prototype.scrollIntoView || (vi.fn() as any);

// TextEncoder/TextDecoder for libraries that rely on them
import { TextEncoder, TextDecoder } from 'node:util';
// @ts-expect-error - attach to global if not present
global.TextEncoder = global.TextEncoder || TextEncoder;
// @ts-expect-error - attach to global if not present
global.TextDecoder = global.TextDecoder || (TextDecoder as unknown as typeof global.TextDecoder);

