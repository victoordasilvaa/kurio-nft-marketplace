import type { RequestHandler, WebSocketHandler } from 'msw';

import { realtimeServer } from '../runtime';
import { controlHandlers } from './control';
import { healthHandlers } from './health';

// todos os handlers do backend simulado: REST, API de controle e servidor Socket.IO
export const handlers: (RequestHandler | WebSocketHandler)[] = [
  ...healthHandlers,
  ...controlHandlers,
  realtimeServer.handler,
];
