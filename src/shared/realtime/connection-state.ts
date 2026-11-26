export type RealtimeConnectionStatus =
  'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface RealtimeConnectionState {
  status: RealtimeConnectionStatus;
  // conexões estabelecidas desde o início; a partir da segunda é reconexão,
  // e os recursos ativos precisam ser reconciliados com a API REST
  connectCount: number;
  lastDisconnectReason: string | null;
  lastError: string | null;
}

export const initialConnectionState: RealtimeConnectionState = {
  status: 'idle',
  connectCount: 0,
  lastDisconnectReason: null,
  lastError: null,
};
