import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import { createQueryClient } from './query-client';
import { createAppRouter } from './router';

// devtools só em desenvolvimento: no build de produção a condição é falsa e o import some do bundle
const AppDevtools = import.meta.env.DEV
  ? lazy(() => import('./devtools').then((module) => ({ default: module.AppDevtools })))
  : null;

export function renderApp(container: HTMLElement): void {
  const queryClient = createQueryClient();
  const router = createAppRouter({ queryClient });

  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {AppDevtools ? (
          <Suspense fallback={null}>
            <AppDevtools router={router} />
          </Suspense>
        ) : null}
      </QueryClientProvider>
    </StrictMode>,
  );
}
