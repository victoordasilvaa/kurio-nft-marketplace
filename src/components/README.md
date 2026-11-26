# src/components

`ui/` guarda os componentes do shadcn/ui (estilo `base-nova`, primitivas do Base UI), adicionados
com `npx shadcn@4.23.1 add <componente>`. Depois de cada `add`, revise o `package.json` e fixe as
versões exatas das dependências novas.

- Hoje existe só o `button`. As variantes ficam em `button-variants.ts` para que o arquivo `.tsx`
  exporte apenas o componente (Fast Refresh) e para que links estilizados como botão reutilizem as
  classes.
- O tema ainda é o padrão do shadcn; os tokens, as fontes e a adaptação visual ao Figma são da fase
  de design system.
- `src/lib/utils.ts` é o alias `@/lib/utils` do shadcn e reexporta `cn` do pacote `cn`.

Não importa `src/app`, `src/routes`, `src/features` nem `src/mocks`.
