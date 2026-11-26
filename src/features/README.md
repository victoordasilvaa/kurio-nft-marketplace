# src/features

Uma pasta por funcionalidade, com a interface, os hooks e as regras de negócio daquele domínio.
Pastas previstas: `catalog`, `nft-detail`, `favorites`, `cart`, `checkout`, `orders`, `auth`,
`profile` e `wallets`. Cada uma é criada pela fase que a implementa.

Hoje existe só `catalog/home-page.tsx`, a página inicial provisória.

Regras:

- pode importar `src/shared` e `src/components`;
- não importa `src/app`, `src/routes` nem `src/mocks` (verificado pelo ESLint);
- não usa `axios` nem `socket.io-client` diretamente: dados remotos passam por `src/shared/api` e
  `src/shared/realtime`, consumidos via TanStack Query;
- regras de negócio ficam fora dos componentes (funções puras ou hooks da própria feature).
