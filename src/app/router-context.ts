import type { QueryClient } from '@tanstack/react-query';

// contexto disponível em beforeLoad e loader de todas as rotas
export interface RouterContext {
  queryClient: QueryClient;
}
