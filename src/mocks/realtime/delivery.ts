import { z } from 'zod';

import type {
  RealtimeAudience,
  RealtimeEnvelope,
  RealtimeEventSchemas,
} from '@/shared/realtime/contract';

// eventos públicos vão para todas as conexões aceitas; privados, só para as do usuário
export function isRecipient(userId: string | null, audience: RealtimeAudience): boolean {
  return audience.scope === 'public' || (userId !== null && userId === audience.userId);
}

// Emissão validada: o servidor simulado nunca envia evento fora do catálogo ou fora do schema.
// Falha aqui é erro de programação do mock e interrompe o handler que publicou.
export function parseEnvelope(
  schemas: RealtimeEventSchemas,
  envelope: RealtimeEnvelope,
): RealtimeEnvelope {
  const schema = Object.hasOwn(schemas, envelope.type) ? schemas[envelope.type] : undefined;
  if (!schema) {
    throw new Error(`Evento de tempo real sem contrato registrado: ${envelope.type}`);
  }
  const result = schema.safeParse(envelope);
  if (!result.success) {
    throw new Error(
      `Evento de tempo real fora do contrato (${envelope.type}):\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
