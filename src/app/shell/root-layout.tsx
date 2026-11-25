import { Outlet } from '@tanstack/react-router';

// casca da aplicação; cabeçalho, rodapé e navegação entram na fase de design system
export function RootLayout() {
  return (
    <main id="conteudo" className="min-h-dvh">
      <Outlet />
    </main>
  );
}
