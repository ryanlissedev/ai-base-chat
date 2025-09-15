import { vi } from 'vitest';

// Ensure test environment flag
process.env.NODE_ENV = 'test';

// Provide TextEncoder/TextDecoder in Node if missing (for libraries expecting them)
import { TextEncoder, TextDecoder } from 'node:util';
// @ts-expect-error - attach to global if not present
global.TextEncoder = global.TextEncoder || TextEncoder;
// @ts-expect-error - attach to global if not present
global.TextDecoder = global.TextDecoder || (TextDecoder as unknown as typeof global.TextDecoder);

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

