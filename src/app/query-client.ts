import { QueryClient } from '@tanstack/react-query';

// padrões provisórios e conservadores; a política final de cache e retry é definida
// junto com os contratos REST e documentada no ARCHITECTURE.md
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
      mutations: {
        // escrita nunca é repetida automaticamente: evita operações duplicadas
        retry: false,
      },
    },
  });
}
