import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    // o plugin do router precisa vir antes do react() para gerar a árvore e dividir o código
    // por rota
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      // sem o eslint-disable e o @ts-nocheck do cabeçalho padrão: o tsc verifica a árvore gerada
      routeTreeFileHeader: ['// noinspection JSUnusedGlobalSymbols'],
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
