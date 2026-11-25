import { Link } from '@tanstack/react-router';

import { buttonVariants } from '@/components/ui/button-variants';

export function NotFoundPage() {
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
