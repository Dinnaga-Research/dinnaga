/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { apiDev } from './scripts/vite-api-dev';

// Dev/preview ports default to 42xx (avoids common ports); PORT and PREVIEW_PORT override them so
// parallel worktrees can each run their own servers.
const port = Number(process.env.PORT ?? 4242);
const previewPort = Number(process.env.PREVIEW_PORT ?? port + 1);

export default defineConfig({
  plugins: [react(), apiDev()],
  server: { port },
  preview: { port: previewPort },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/tests/e2e/**',
      '**/tests/fixtures/**',
      '**/dist/**',
      // Throwaway screenshot scripts live under .darkroom/ (gitignored); never collect them.
      '**/.darkroom/**',
    ],
  },
});
