import { vi } from 'vitest';

// Ensure test environment flag
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
    enumerable: true,
    configurable: true
  });
}

// Provide TextEncoder/TextDecoder in Node if missing (for libraries expecting them)
import { TextEncoder, TextDecoder } from 'node:util';
if (!global.TextEncoder) {
  (global as typeof global & { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  (global as typeof global & { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

// Mock Next.js router/navigation to prevent imports from crashing in Node tests
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

