import { test as base, expect } from '@playwright/test';

export interface ConsoleGuard {
  // declara uma mensagem de console esperada no teste (console.error ou aviso do MSW), por exemplo
  // uma resposta HTTP de erro provocada de propósito
  allow: (pattern: RegExp) => void;
}

interface ConsoleProblem {
  type: string;
  text: string;
}

// aviso do MSW indica configuração errada do backend simulado (handler que lança exceção, worker
// desatualizado); no build de produção o MSW roda em modo quiet e não emite nenhum outro aviso
function isConsoleProblem(type: string, text: string): boolean {
  return type === 'error' || (type === 'warning' && text.startsWith('[MSW]'));
}

// Todo teste falha se a página lançar exceção não tratada, registrar console.error ou emitir aviso
// do MSW que o próprio teste não declarou como esperado. Exceções nunca são toleradas.
export const test = base.extend<{ consoleGuard: ConsoleGuard }>({
  consoleGuard: [
    async ({ page }, use) => {
      const pageErrors: string[] = [];
      const consoleProblems: ConsoleProblem[] = [];
      const allowed: RegExp[] = [];
      page.on('pageerror', (error) => {
        pageErrors.push(error.message);
      });
      page.on('console', (message) => {
        const type = message.type();
        const text = message.text();
        if (isConsoleProblem(type, text)) consoleProblems.push({ type, text });
      });

      await use({
        allow: (pattern) => {
          allowed.push(pattern);
        },
      });

      expect(pageErrors, 'exceções não tratadas na página').toEqual([]);
      expect(
        consoleProblems
          .filter(({ text }) => !allowed.some((pattern) => pattern.test(text)))
          .map(({ type, text }) => `${type}: ${text}`),
        'console.error ou aviso do MSW não declarado pelo teste',
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
