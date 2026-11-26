import { getEnv } from '@/shared/config/env';
import { serverToClientEventSchemas, type ServerToClientEvent } from '@/shared/realtime/events';

import { createMockBackendStore } from './state';
import { createRealtimeBus } from './realtime/bus';
import { createRealtimeServer } from './realtime/server';

// Instâncias do backend simulado, uma por aba (vivem na thread principal, junto do app).

export const mockBackend = createMockBackendStore('default');

// handlers REST publicam aqui os eventos que o servidor de tempo real entrega
export const realtimeBus = createRealtimeBus<ServerToClientEvent>();

export const realtimeServer = createRealtimeServer({
  url: getEnv().realtimeUrl,
  events: serverToClientEventSchemas,
  source: realtimeBus,
  // ainda não existem sessões no backend simulado: todo token é recusado (CONNECT_ERROR)
  // e só conexões de visitante são aceitas; a fase de autenticação liga a tabela de sessões
  resolveUserId: () => null,
});
