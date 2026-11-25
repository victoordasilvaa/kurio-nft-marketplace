import { createFileRoute } from '@tanstack/react-router';

// página inicial provisória: a fase de catálogo substitui pelo layout do Figma
export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <section className="mx-auto flex max-w-xl flex-col gap-2 px-4 py-16">
      <h1 className="text-4xl font-bold">Kurio</h1>
      <p>Marketplace de NFTs.</p>
    </section>
  );
}
