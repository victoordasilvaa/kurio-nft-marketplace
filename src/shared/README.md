# src/shared

Código compartilhado entre features, sem dependência de `app`, `routes`, `features` ou `mocks`.

| Pasta      | Responsabilidade                                                     | Estado   |
| ---------- | -------------------------------------------------------------------- | -------- |
| `config`   | Ambiente validado com zod (`getEnv`)                                 | existe   |
| `lib`      | Utilitários genéricos (store observável para `useSyncExternalStore`) | existe   |
| `realtime` | Cliente Socket.IO, estado da conexão e contrato de eventos           | existe   |
| `api`      | Cliente Axios e contratos REST (único lugar que importa `axios`)     | pendente |
| `domain`   | Tipos e regras puras de domínio (valores em ETH, versões)            | pendente |
| `ui`       | Componentes compostos reutilizados por várias features               | pendente |

`socket.io-client` só pode ser importado em `realtime` e `axios` só em `api` (ESLint). Os
contratos (schemas zod) são a fonte de verdade dos tipos e também são usados pelo backend simulado.
