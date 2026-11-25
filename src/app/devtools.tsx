import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import type { AppRouter } from './router';

export function AppDevtools({ router }: { router: AppRouter }) {
  return (
    <>
      <TanStackRouterDevtools router={router} position="bottom-right" />
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </>
  );
}
