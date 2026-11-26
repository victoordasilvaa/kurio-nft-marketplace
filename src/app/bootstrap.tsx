import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import { getEnv } from '@/shared/config/env';
import { RealtimeProvider } from '@/shared/realtime/realtime-provider';
import { createRealtimeClient } from '@/shared/realtime/socket';

import { createQueryClient } from './query-client';
import { createAppRouter } from './router';

// devtools só em desenvolvimento: no build de produção a condição é falsa e o import some do bundle
const AppDevtools = import.meta.env.DEV
  ? lazy(() => import('./devtools').then((module) => ({ default: module.AppDevtools })))
  : null;

export function renderApp(container: HTMLElement): void {
  const env = getEnv();
  const queryClient = createQueryClient();
  const router = createAppRouter({ queryClient });

  // conexão de tempo real aberta ao iniciar, como visitante; a fase de autenticação
  // passa a criar uma conexão por sessão, com o token no auth
  const realtime = createRealtimeClient({ url: env.realtimeUrl, getAuth: () => ({}) });
  realtime.connect();

  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider client={realtime}>
          <RouterProvider router={router} />
        </RealtimeProvider>
        {AppDevtools ? (
          <Suspense fallback={null}>
            <AppDevtools router={router} />
          </Suspense>
        ) : null}
      </QueryClientProvider>
    </StrictMode>,
  );
}
