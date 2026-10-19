/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev/preview ports use 42xx — avoids common ports.
export default defineConfig({
  plugins: [react()],
  server: { port: 4242 },
  preview: { port: 4243 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/tests/e2e/**', '**/dist/**'],
  },
});
