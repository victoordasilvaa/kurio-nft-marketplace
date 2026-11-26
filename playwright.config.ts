import { defineConfig, devices } from '@playwright/test';

// Os testes rodam contra o build de produção (com o backend simulado do .env.production)
// servido pelo vite preview. Com PLAYWRIGHT_BASE_URL, rodam contra um deploy, sem subir servidor.
const port = Number(process.env.PORT ?? '4310');
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`PORT inválida para os testes E2E: ${process.env.PORT ?? ''}`);
}
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }], ['list']],
  // Baselines visuais versionadas, geradas só em Linux: sem {platform} no caminho, um único arquivo
  // por projeto e tela. Os projetos visuais rodam só na imagem oficial
  // mcr.microsoft.com/playwright:v1.65.0-noble, de tag igual à versão do @playwright/test: com
  // outra tag, o Playwright não encontra os navegadores da imagem
  // (conferido em tooling/playwright-image.test.ts).
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  use: {
    baseURL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // o MSW depende do service worker: nunca usar 'block'
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        screen: { width: 1440, height: 900 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        screen: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        screen: { width: 768, height: 1024 },
        hasTouch: true,
      },
    },
  ],
  webServer:
    externalBaseUrl === undefined
      ? {
          // build novo a cada execução: o teste nunca roda contra um dist antigo
          command: `npm run build && npm run preview -- --port ${port} --strictPort --host 127.0.0.1`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 180_000,
        }
      : undefined,
});
