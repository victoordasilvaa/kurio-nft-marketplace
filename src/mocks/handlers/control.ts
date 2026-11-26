import { http, HttpResponse } from 'msw';

import {
  MOCK_CONTROL_BASE_PATH,
  type MockControlError,
  mockResetRequestSchema,
  type MockStateSnapshot,
} from '../control/contract';
import { mockBackend, realtimeServer } from '../runtime';

function snapshot(): MockStateSnapshot {
  return {
    scenario: mockBackend.getState().scenario,
    realtime: { connections: realtimeServer.listConnections() },
  };
}

function controlError(status: number, body: MockControlError) {
  return HttpResponse.json<MockControlError>(body, { status });
}

// corpo opcional: ausente ou vazio equivale a {}
async function readOptionalJson(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const text = await request.text();
  if (text.trim() === '') return { ok: true, value: {} };
  try {
    const value: unknown = JSON.parse(text);
    return { ok: true, value };
  } catch {
    return { ok: false };
  }
}

// API de controle do backend simulado: só existe no MSW, nunca chega à rede
export const controlHandlers = [
  http.get(`${MOCK_CONTROL_BASE_PATH}/state`, () => HttpResponse.json(snapshot())),

  http.post(`${MOCK_CONTROL_BASE_PATH}/reset`, async ({ request }) => {
    const body = await readOptionalJson(request);
    if (!body.ok) {
      return controlError(400, {
        message: 'O corpo da requisição não é um JSON válido.',
        issues: [],
      });
    }
    const parsed = mockResetRequestSchema.safeParse(body.value);
    if (!parsed.success) {
      return controlError(422, {
        message: 'Pedido de reset inválido.',
        issues: parsed.error.issues.map(
          (issue) => `${issue.path.join('.') || '(corpo)'}: ${issue.message}`,
        ),
      });
    }
    mockBackend.reset(parsed.data.scenario);
    return HttpResponse.json(snapshot());
  }),
];
