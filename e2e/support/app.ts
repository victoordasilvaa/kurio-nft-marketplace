import { expect, type Page, type Response } from '@playwright/test';

import {
  MOCK_CONTROL_BASE_PATH,
  mockStateSchema,
  type MockStateSnapshot,
} from '../../src/mocks/control/contract';

export interface PageResponse {
  status: number;
  body: unknown;
}

// O app só renderiza depois do worker.start() do MSW (src/main.tsx). Antes disso, uma chamada
// feita pela página iria direto ao servidor de preview; por isso todo teste abre o app por aqui.
export async function openApp(page: Page, path = '/'): Promise<Response | null> {
  const response = await page.goto(path);
  await expect(page.getByRole('main')).toBeVisible();
  return response;
}

// A requisição sai de dentro da página: só assim passa pelo service worker do MSW.
// (page.request roda fora do navegador e iria direto ao servidor de preview.)
export async function fetchFromPage(
  page: Page,
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown } = { method: 'GET' },
): Promise<PageResponse> {
  return page.evaluate(
    async ({ path: url, method, body }) => {
      const response = await fetch(url, {
        method,
        headers: body === undefined ? undefined : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      try {
        const json: unknown = JSON.parse(text);
        return { status: response.status, body: json };
      } catch {
        throw new Error(
          `${method} ${url} respondeu ${response.status} sem JSON: ${text.slice(0, 80)}`,
        );
      }
    },
    { path, method: init.method, body: init.body },
  );
}

export async function readMockState(page: Page): Promise<MockStateSnapshot> {
  const response = await fetchFromPage(page, `${MOCK_CONTROL_BASE_PATH}/state`);
  if (response.status !== 200) {
    throw new Error(`GET ${MOCK_CONTROL_BASE_PATH}/state respondeu ${response.status}`);
  }
  return mockStateSchema.parse(response.body);
}

export async function controllingServiceWorker(page: Page): Promise<string | null> {
  return page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? null);
}
