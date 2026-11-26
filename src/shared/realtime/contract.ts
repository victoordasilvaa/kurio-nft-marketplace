import { z } from 'zod';

// Contrato de tempo real compartilhado entre o cliente (src/shared/realtime) e o servidor
// simulado (src/mocks/realtime). Nenhum dos lados confia no tipo: tudo passa pelos schemas.

// dados enviados pelo cliente no pacote CONNECT do Socket.IO (opção auth); visitante não envia token
export const realtimeAuthSchema = z.object({
  token: z.string().min(1).optional(),
});
export type RealtimeAuth = z.infer<typeof realtimeAuthSchema>;

// quem recebe o evento: todas as conexões ou só as conexões autenticadas do usuário
export const realtimeAudienceSchema = z.discriminatedUnion('scope', [
  z.object({ scope: z.literal('public') }),
  z.object({ scope: z.literal('user'), userId: z.string().min(1) }),
]);
export type RealtimeAudience = z.infer<typeof realtimeAudienceSchema>;

// forma comum de todo evento servidor -> cliente: identidade estável (id) para descartar
// duplicatas, recurso afetado e versão monotônica do recurso (a mesma da API REST)
export interface RealtimeEnvelope {
  id: string;
  type: string;
  resource: { type: string; id: string };
  version: number;
  occurredAt: string;
  audience: RealtimeAudience;
  data: unknown;
}

// cria o schema de um evento a partir do nome, do tipo de recurso e do schema dos dados
export function defineRealtimeEvent<
  TType extends string,
  TResourceType extends string,
  TData extends z.ZodType,
>(type: TType, resourceType: TResourceType, data: TData) {
  return z.object({
    id: z.string().min(1),
    type: z.literal(type),
    resource: z.object({ type: z.literal(resourceType), id: z.string().min(1) }),
    version: z.number().int().positive(),
    occurredAt: z.iso.datetime(),
    audience: realtimeAudienceSchema,
    data,
  });
}

// catálogo de eventos: nome do evento -> schema do envelope
export type RealtimeEventSchemas = Readonly<Record<string, z.ZodType<RealtimeEnvelope>>>;

export type RealtimeEventOf<TSchemas extends RealtimeEventSchemas> = {
  [TName in keyof TSchemas]: z.output<TSchemas[TName]>;
}[keyof TSchemas];
