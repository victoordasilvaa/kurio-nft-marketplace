import { createContext, useContext, useSyncExternalStore } from 'react';

import type { RealtimeConnectionState } from './connection-state';
import type { RealtimeClient } from './socket';

export const RealtimeClientContext = createContext<RealtimeClient | null>(null);

export function useRealtimeClient(): RealtimeClient {
  const client = useContext(RealtimeClientContext);
  if (!client) {
    throw new Error('useRealtimeClient precisa ser usado dentro de RealtimeProvider.');
  }
  return client;
}

// estado observável da conexão (indicador de conexão, reconciliação após reconectar)
export function useRealtimeConnectionState(): RealtimeConnectionState {
  const client = useRealtimeClient();
  return useSyncExternalStore(client.subscribe, client.getState);
}
