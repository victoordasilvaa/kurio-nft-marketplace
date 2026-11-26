import type { RealtimeEventOf, RealtimeEventSchemas } from './contract';

// Eventos servidor -> cliente aceitos pela aplicação. O servidor simulado só emite eventos
// registrados aqui (e validados pelo schema). nft.updated e order.updated entram junto com
// os contratos de domínio (NFT, edição e pedido), definidos com defineRealtimeEvent.
export const serverToClientEventSchemas = {} satisfies RealtimeEventSchemas;

export type ServerToClientEvent = RealtimeEventOf<typeof serverToClientEventSchemas>;
