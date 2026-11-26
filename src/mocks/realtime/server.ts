import { toSocketIo } from '@mswjs/socket.io-binding';
import { type WebSocketHandler, ws } from 'msw';

import {
  type RealtimeEnvelope,
  type RealtimeEventSchemas,
  realtimeAuthSchema,
} from '@/shared/realtime/contract';

import type { RealtimeConnectionView } from '../control/contract';
import { isRecipient, parseEnvelope } from './delivery';
import { ENGINE_IO_PING, encodeConnectError, readClientConnect } from './protocol';

// O binding 0.2.0 anuncia pingInterval 25000 + pingTimeout 5000 e nunca envia ping;
// sem o ping do servidor o cliente encerra a conexão por "ping timeout" em ~30 s.
export const HEARTBEAT_INTERVAL_MS = 20_000;

export interface RealtimeEventSource {
  subscribe: (listener: (envelope: RealtimeEnvelope) => void) => () => void;
}

export interface RealtimeServerOptions {
  // origem passada ao io() do cliente; o MSW remove o prefixo /socket.io/ antes de comparar
  url: string;
  events: RealtimeEventSchemas;
  source: RealtimeEventSource;
  // token do CONNECT -> usuário da sessão, ou null quando o token não é reconhecido
  resolveUserId: (token: string) => string | null;
  heartbeatIntervalMs?: number;
}

export interface RealtimeServer {
  handler: WebSocketHandler;
  listConnections: () => RealtimeConnectionView[];
}

interface ConnectionEntry {
  view: RealtimeConnectionView;
  emit: (event: string, payload: RealtimeEnvelope) => void;
}

export function createRealtimeServer(options: RealtimeServerOptions): RealtimeServer {
  const heartbeatIntervalMs = options.heartbeatIntervalMs ?? HEARTBEAT_INTERVAL_MS;
  // registro por aba: o binding não tem rooms nem broadcast, então a entrega por usuário
  // é decidida aqui, no momento da entrega
  const connections = new Map<string, ConnectionEntry>();

  options.source.subscribe((envelope) => {
    const event = parseEnvelope(options.events, envelope);
    for (const entry of connections.values()) {
      if (entry.view.handshake !== 'accepted') continue;
      if (!isRecipient(entry.view.userId, event.audience)) continue;
      entry.emit(event.type, event);
    }
  });

  const handler = ws.link(options.url).addEventListener('connection', (connection) => {
    const { client } = connection;
    // o binding responde o handshake do Engine.IO e confirma o namespace padrão
    const io = toSocketIo(connection);
    const entry: ConnectionEntry = {
      view: {
        id: client.id,
        url: client.url.href,
        connectedAt: new Date().toISOString(),
        handshake: 'pending',
        userId: null,
      },
      emit: (event, payload) => {
        io.client.emit(event, payload);
      },
    };
    connections.set(entry.view.id, entry);

    const reject = (code: string) => {
      entry.view.handshake = 'rejected';
      client.send(encodeConnectError('unauthorized', { code }));
    };

    // o CONNECT com o auth chega depois da confirmação do binding: o cliente vê "connect"
    // e, se o token for recusado, "connect_error" em seguida
    client.addEventListener('message', (message) => {
      if (entry.view.handshake !== 'pending' || typeof message.data !== 'string') return;
      const connect = readClientConnect(message.data);
      if (!connect) return;
      const auth = realtimeAuthSchema.safeParse(connect.auth);
      if (!auth.success) {
        reject('invalid_auth');
        return;
      }
      if (auth.data.token === undefined) {
        entry.view.handshake = 'accepted';
        return;
      }
      const userId = options.resolveUserId(auth.data.token);
      if (userId === null) {
        reject('invalid_token');
        return;
      }
      entry.view.userId = userId;
      entry.view.handshake = 'accepted';
    });

    const heartbeat = window.setInterval(() => {
      client.send(ENGINE_IO_PING);
    }, heartbeatIntervalMs);

    client.addEventListener('close', () => {
      window.clearInterval(heartbeat);
      connections.delete(entry.view.id);
    });
  });

  return {
    handler,
    listConnections: () => [...connections.values()].map((entry) => ({ ...entry.view })),
  };
}
