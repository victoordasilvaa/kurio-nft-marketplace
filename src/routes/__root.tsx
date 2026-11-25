import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';

import type { RouterContext } from '@/app/router-context';
import { buttonVariants } from '@/components/ui/button';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

function RootLayout() {
  return (
    <main id="conteudo" className="min-h-dvh">
      <Outlet />
    </main>
  );
}

function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p>O endereço acessado não existe ou foi removido.</p>
      <Link to="/" className={buttonVariants()}>
        Voltar para o início
      </Link>
    </section>
  );
}
