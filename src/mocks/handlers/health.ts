import { http, HttpResponse } from 'msw';

import { apiUrl } from './api-url';

interface HealthResponse {
  status: 'ok';
}

export const healthHandlers = [
  http.get(apiUrl('/health'), () => HttpResponse.json<HealthResponse>({ status: 'ok' })),
];
