import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

// testes unitários de lógica pura: ambiente node, sem plugins de build
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
