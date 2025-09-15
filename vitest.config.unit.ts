import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom environment for React component tests
    environment: 'jsdom',
    globals: true,
    include: [
      'tests/unit/components/**/*.test.{ts,tsx}',
      'tests/unit/components/**/*.spec.{ts,tsx}',
    ],
    exclude: ['tests/e2e/**/*', 'tests/pages/**/*', 'node_modules/**/*'],
    // DOM-focused setup file
    setupFiles: ['./tests/setup.dom.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
