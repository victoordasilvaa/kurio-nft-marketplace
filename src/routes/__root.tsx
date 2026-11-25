import { createRootRouteWithContext } from '@tanstack/react-router';

import type { RouterContext } from '@/app/router-context';
import { NotFoundPage } from '@/app/shell/not-found-page';
import { RootLayout } from '@/app/shell/root-layout';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});
