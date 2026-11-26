import { test as base, expect } from '@playwright/test';

export interface ConsoleGuard {
  // declara um console.error esperado no teste (ex.: resposta HTTP de erro provocada de propósito)
  allow: (pattern: RegExp) => void;
}

// Todo teste falha se a página lançar exceção não tratada ou registrar console.error
// que o próprio teste não declarou como esperado. Exceções nunca são toleradas.
export const test = base.extend<{ consoleGuard: ConsoleGuard }>({
  consoleGuard: [
    async ({ page }, use) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      const allowed: RegExp[] = [];
      page.on('pageerror', (error) => {
        pageErrors.push(error.message);
      });
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      await use({
        allow: (pattern) => {
          allowed.push(pattern);
        },
      });

      expect(pageErrors, 'exceções não tratadas na página').toEqual([]);
      expect(
        consoleErrors.filter((text) => !allowed.some((pattern) => pattern.test(text))),
        'console.error não declarado pelo teste',
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
