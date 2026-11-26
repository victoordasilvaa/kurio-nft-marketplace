import { z } from 'zod';

// Contrato da API de controle do backend simulado (/__mock/*), usada pelos testes E2E e pela
// demonstração. Arquivo puro (só zod, sem aliases): o Playwright importa este módulo direto.

export const MOCK_CONTROL_BASE_PATH = '/__mock';

// cenários determinísticos disponíveis; cada fase acrescenta os seus
export const mockScenarioIdSchema = z.enum(['default']);
export type MockScenarioId = z.infer<typeof mockScenarioIdSchema>;

export const realtimeConnectionViewSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  connectedAt: z.iso.datetime(),
  // pending: WebSocket aberto, aguardando o CONNECT do Socket.IO; accepted: visitante
  // (userId nulo) ou usuário autenticado; rejected: CONNECT_ERROR enviado ao cliente
  handshake: z.enum(['pending', 'accepted', 'rejected']),
  userId: z.string().min(1).nullable(),
});
export type RealtimeConnectionView = z.infer<typeof realtimeConnectionViewSchema>;

export const mockStateSchema = z.object({
  scenario: mockScenarioIdSchema,
  realtime: z.object({
    connections: z.array(realtimeConnectionViewSchema),
  }),
});
export type MockStateSnapshot = z.infer<typeof mockStateSchema>;

export const mockResetRequestSchema = z.strictObject({
  scenario: mockScenarioIdSchema.default('default'),
});
export type MockResetRequest = z.input<typeof mockResetRequestSchema>;

export const mockControlErrorSchema = z.object({
  message: z.string().min(1),
  issues: z.array(z.string()),
});
export type MockControlError = z.infer<typeof mockControlErrorSchema>;
