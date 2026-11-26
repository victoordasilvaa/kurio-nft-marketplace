import { io, type Socket } from 'socket.io-client';

import { createStore } from '@/shared/lib/create-store';

import { initialConnectionState, type RealtimeConnectionState } from './connection-state';
import type { RealtimeAuth } from './contract';

// o cliente não emite eventos (toda escrita é REST); ainda não há eventos de domínio
// escutados: os listeners entram com o catálogo de events.ts e validam cada payload
type ClientToServerEvents = Record<string, never>;
type ServerToClientEvents = Record<string, never>;

export interface RealtimeClientOptions {
  url: string;
  // reavaliado a cada conexão e reconexão: sempre envia a credencial atual
  getAuth: () => RealtimeAuth;
}

export interface RealtimeClient {
  connect: () => void;
  disconnect: () => void;
  getState: () => RealtimeConnectionState;
  subscribe: (listener: () => void) => () => void;
}

export function createRealtimeClient({ url, getAuth }: RealtimeClientOptions): RealtimeClient {
  const store = createStore<RealtimeConnectionState>(initialConnectionState);

  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
    autoConnect: false,
    // Manager próprio por cliente: nada da conexão de uma sessão anterior é reaproveitado
    forceNew: true,
    // o servidor simulado (MSW) só intercepta WebSocket; long-polling não passa por ele
    transports: ['websocket'],
    auth: (send) => {
      send(getAuth());
    },
  });

  socket.on('connect', () => {
    store.update((state) => ({
      ...state,
      status: 'connected',
      connectCount: state.connectCount + 1,
      lastError: null,
    }));
  });

  // socket.active indica se o cliente vai tentar reconectar sozinho
  socket.on('disconnect', (reason) => {
    store.update((state) => ({
      ...state,
      status: socket.active ? 'reconnecting' : 'disconnected',
      lastDisconnectReason: reason,
    }));
  });

  socket.on('connect_error', (error) => {
    store.update((state) => ({
      ...state,
      status: socket.active ? 'reconnecting' : 'disconnected',
      lastError: error.message,
    }));
  });

  return {
    connect: () => {
      if (socket.active) return;
      store.update((state) => ({ ...state, status: 'connecting' }));
      socket.connect();
    },
    disconnect: () => {
      socket.disconnect();
    },
    getState: store.getState,
    subscribe: store.subscribe,
  };
}
