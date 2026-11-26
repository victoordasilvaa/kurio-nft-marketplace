import {
  MOCK_CONTROL_BASE_PATH,
  mockControlErrorSchema,
  type MockResetRequest,
  mockStateSchema,
} from '../src/mocks/control/contract';
import { expect, test } from './support/fixtures';
import { controllingServiceWorker, fetchFromPage, openApp, readMockState } from './support/app';

const MSW_WORKER_SCRIPT = /\/mockServiceWorker\.js$/;
// URL do handshake do Engine.IO v4 (transporte WebSocket) na origem de tempo real configurada
const REALTIME_HANDSHAKE_URL = 'wss://realtime.kurio.test/socket.io/?EIO=4&transport=websocket';

test.describe('smoke do bootstrap', () => {
  test('a home carrega com o título', async ({ page }) => {
    await openApp(page);

    await expect(page).toHaveTitle('Kurio | Marketplace de NFTs');
    await expect(page.getByRole('heading', { level: 1, name: 'Kurio' })).toBeVisible();
  });

  test('o service worker do MSW está ativo e GET /api/health responde pelo mock', async ({
    page,
  }) => {
    await openApp(page);

    expect(await controllingServiceWorker(page)).toMatch(MSW_WORKER_SCRIPT);

    const healthResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/health',
    );
    const health = await fetchFromPage(page, '/api/health');

    expect(health).toEqual({ status: 200, body: { status: 'ok' } });
    expect((await healthResponse).fromServiceWorker()).toBe(true);
  });

  test('o app abre uma conexão Socket.IO registrada pelo servidor simulado', async ({ page }) => {
    await openApp(page);

    // accepted só acontece depois que o servidor leu o CONNECT enviado pelo socket.io-client
    await expect
      .poll(async () => (await readMockState(page)).realtime.connections.map((c) => c.handshake))
      .toEqual(['accepted']);

    const { connections } = (await readMockState(page)).realtime;
    expect(connections).toEqual([
      expect.objectContaining({ handshake: 'accepted', userId: null, url: REALTIME_HANDSHAKE_URL }),
    ]);
  });

  test('a conexão de tempo real se mantém com o heartbeat do servidor simulado', async ({
    page,
  }) => {
    // o binding anuncia pingInterval 25 s + pingTimeout 5 s e não envia ping: sem o heartbeat
    // do servidor simulado o cliente cairia por "ping timeout" e abriria outra conexão
    await page.clock.install();
    await openApp(page);
    await expect
      .poll(async () => (await readMockState(page)).realtime.connections.map((c) => c.handshake))
      .toEqual(['accepted']);
    const [before] = (await readMockState(page)).realtime.connections;
    if (!before) throw new Error('nenhuma conexão registrada antes de avançar o relógio');

    await page.clock.runFor('02:00');

    const after = (await readMockState(page)).realtime.connections;
    expect(after).toEqual([expect.objectContaining({ id: before.id, handshake: 'accepted' })]);
  });

  test('rota inexistente mostra a página 404 da aplicação', async ({ page }) => {
    const response = await openApp(page, '/rota-que-nao-existe');

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Voltar para o início' }).click();

    await expect(page).toHaveURL((url) => url.pathname === '/');
    await expect(page.getByRole('heading', { level: 1, name: 'Kurio' })).toBeVisible();
  });

  test('refresh numa rota profunda funciona no preview', async ({ page }) => {
    // ainda não há rota profunda real; a fase de catálogo troca este caminho pelo detalhe do NFT
    const deepPath = '/nivel-1/nivel-2/nivel-3';
    const notFoundHeading = page.getByRole('heading', { level: 1, name: 'Página não encontrada' });

    const first = await openApp(page, deepPath);
    expect(first?.status()).toBe(200);
    expect(first?.headers()['content-type']).toContain('text/html');
    await expect(notFoundHeading).toBeVisible();

    const reloaded = await page.reload();
    expect(reloaded?.status()).toBe(200);
    await expect(page).toHaveURL((url) => url.pathname === deepPath);
    await expect(notFoundHeading).toBeVisible();

    // depois do refresh o app sobe de novo com os mocks e o tempo real
    expect(await controllingServiceWorker(page)).toMatch(MSW_WORKER_SCRIPT);
    await expect
      .poll(async () => (await readMockState(page)).realtime.connections.map((c) => c.handshake))
      .toEqual(['accepted']);
  });

  test('a API de controle restaura o cenário padrão e valida o pedido', async ({
    page,
    consoleGuard,
  }) => {
    // o 422 abaixo é provocado de propósito; o Chromium registra toda resposta de erro no console
    consoleGuard.allow(/status of 422 \(Unprocessable Entity\)/);
    await openApp(page);

    const reset = await fetchFromPage(page, `${MOCK_CONTROL_BASE_PATH}/reset`, {
      method: 'POST',
      body: { scenario: 'default' } satisfies MockResetRequest,
    });
    expect(reset.status).toBe(200);
    expect(mockStateSchema.parse(reset.body).scenario).toBe('default');

    const invalid = await fetchFromPage(page, `${MOCK_CONTROL_BASE_PATH}/reset`, {
      method: 'POST',
      body: { scenario: 'inexistente' },
    });
    expect(invalid.status).toBe(422);
    const { issues } = mockControlErrorSchema.parse(invalid.body);
    expect(issues.some((issue) => issue.startsWith('scenario:'))).toBe(true);
  });
});
