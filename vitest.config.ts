import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    environment: 'node',
    // Exclude Playwright E2E and Node's built-in test file to avoid unrelated failures
    exclude: [
      'node_modules/**',
      'tests/**',
      'lib/ai/text-splitter.test.ts',
    ],
  },
});

