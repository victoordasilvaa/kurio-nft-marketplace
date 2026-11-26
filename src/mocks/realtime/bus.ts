import type { RealtimeEnvelope } from '@/shared/realtime/contract';

// Barramento interno do backend simulado: os handlers REST (e a API de controle) publicam
// eventos depois de alterar o estado, e o servidor de tempo real entrega às conexões.
// A UI nunca publica aqui: todo evento chega ao app pelo socket.io-client.
export interface RealtimeBus<TEnvelope extends RealtimeEnvelope> {
  publish: (envelope: TEnvelope) => void;
  subscribe: (listener: (envelope: TEnvelope) => void) => () => void;
}

export function createRealtimeBus<TEnvelope extends RealtimeEnvelope>(): RealtimeBus<TEnvelope> {
  const listeners = new Set<(envelope: TEnvelope) => void>();
  return {
    publish: (envelope) => {
      for (const listener of [...listeners]) {
        listener(envelope);
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
