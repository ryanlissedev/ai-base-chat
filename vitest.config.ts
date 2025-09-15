import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    // Node environment for API, utils, and non-DOM logic
    environment: 'node',
    globals: true,
    include: [
      'lib/**/*.test.ts',
      'lib/**/*.spec.ts',
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.spec.ts',
      // Explicitly exclude component tests (tsx) from the node suite
      '!tests/unit/components/**/*',
    ],
    exclude: [
      'tests/e2e/**/*',
      'tests/pages/**/*',
      'node_modules/**/*',
    ],
    // Node-only setup
    setupFiles: ['./tests/setup.node.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
