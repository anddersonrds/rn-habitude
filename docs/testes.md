# Testes

Que tipos de teste existem, onde eles moram, como se chamam, e o que precisa
estar verde antes de um pull request.

[← Voltar ao README](../README.md)

## Índice

- [Rodando](#rodando)
- [Os tipos de teste](#os-tipos-de-teste)
- [Onde eles moram e como se chamam](#onde-eles-moram-e-como-se-chamam)
- [Como se escreve um caso](#como-se-escreve-um-caso)
- [Snapshots](#snapshots)
- [As ferramentas em `test-utils/`](#as-ferramentas-em-test-utils)
- [Os gates](#os-gates)
- [Cobertura](#cobertura)
- [O que nenhum gate consegue ver](#o-que-nenhum-gate-consegue-ver)

## Rodando

```bash
bun run test          # a suíte inteira
bun run test:watch    # re-executa a cada alteração
bun run test:ci       # com cobertura, como a CI roda
```

**Rode sempre por esses scripts, nunca chamando `jest` direto.** Eles fixam o
idioma (`en_US.UTF-8`) e o fuso (`America/Sao_Paulo`), sem os quais um resultado
mudaria com a máquina que rodou. A suíte se recusa a iniciar se eles faltarem -
`assertStableEnvironment` em `src/test-utils/time.ts`.

O fuso não é UTC de propósito: toda chave de data no app é meia-noite local, e
UTC esconderia exatamente o erro que isso pode causar.

Jest com o preset `jest-expo/ios` e `@testing-library/react-native`. Nada
precisa de device nem de simulador.

## Os tipos de teste

**`unit`** cobre um módulo. É a esmagadora maioria da suíte, e inclui as telas:
uma tela é testada renderizando-a com `renderWithProviders` e afirmando o que
ela faz, não o que ela desenha.

**`integration`** cobre um fluxo que atravessa fronteiras de módulo, e mora
junto do módulo que é dono do fluxo. Existe um hoje,
`src/lib/data/store/__tests__/store.integration.test.ts`, porque o store escreve
em SQLite de verdade - o mock é o `expo-sqlite`, não o banco, então o schema, as
queries e as transações sob ele são o código que vai para produção.

## Onde eles moram e como se chamam

O `__tests__/` fica **ao lado do código que ele cobre**, o que hoje significa
dentro da pasta do hook e dentro da pasta do componente:

```
src/lib/domain/__tests__/streaks.unit.test.ts
src/components/heat-graph/__tests__/heat-graph.unit.test.tsx
src/features/today/hooks/use-today-model/__tests__/use-today-model.unit.test.ts
src/lib/data/store/__tests__/store.integration.test.ts
```

O nome é o do módulo em kebab-case, mais o tipo, mais `.test`. `.tsx` quando
renderiza, `.ts` quando não.

Quando um módulo muda de lugar, **o teste dele muda no mesmo commit**, para que
a suíte esteja verde em todo commit e não só no fim.

## Como se escreve um caso

Todo `it` começa com **"should"**, e o texto diz a consequência observável, não
a implementação:

```ts
describe("useTodayModel", () => {
  it("should mark a habit as done after a check-in", async () => {
    /* ... */
  });
});
```

Uma asserção nomeia uma prop, uma string ou um handler que carrega significado.
Se mudar um rótulo, um tint ou um estado desabilitado quebra a suíte com o nome
daquilo, o teste está certo; se reordenar duas views irmãs quebra a suíte, ele
está afirmando forma em vez de comportamento.

**Veja o teste falhar antes de confiar nele.** Um caso escrito depois da
correção passa por construção. Guarde a correção, rode o caso, veja a falha com
a mensagem que ela deveria dar, e só então restaure.

## Snapshots

**Não há nenhum snapshot neste projeto**, e `find src -name "*.snap*"` não
retorna nada.

Havia quatro, das telas today, habits, habit-form e settings, somando 10.815
linhas - só o habit-form tinha 7.295. Eles foram apagados e substituídos por
asserções de comportamento antes de qualquer arquivo ser movido nesta
reorganização. O motivo é direto: um pull request com mil linhas de mudança real
mais dez mil linhas de snapshot regenerado não é revisado, é aprovado.

A regra que sobrou é mais estreita do que a prática antiga: **um snapshot é
permitido apenas para um componente pequeno e estável.** Uma tela afirma
comportamento, explicitamente.

## As ferramentas em `test-utils/`

`src/test-utils/` está fora da cobertura e guarda o que os testes compartilham:

| Arquivo | O que oferece |
| --- | --- |
| `render.tsx` | `renderWithProviders`, que espelha a pilha de providers do layout raiz |
| `factories.ts` | `makeHabit`, `makeCompletions`, `makeAppState` |
| `time.ts` | o relógio congelado, ids estáveis, e a checagem de ambiente |
| `sqlite.ts` | o banco de teste sobre `node:sqlite` e o mock do `expo-sqlite` |
| `native-events.ts` | `tapNative`, `pressButton`, `typeInto`, `toggleSwitch`, `moveRow`, `chooseOption`, `pickDate` |
| `native-views.ts` | `symbolView`, `nativeView`, `modifier`, para achar uma view `@expo/ui` na árvore |
| `expo-router.tsx` | `expoRouterMock` |

As telas SwiftUI são `@expo/ui`, então o runner não renderiza componente nativo
nenhum - ele vê os elementos que o React declarou. `native-events.ts` verifica
que o alvo carrega o handler antes de disparar, para que uma prop renomeada
falhe com uma mensagem clara em vez de um teste que passa sem tocar em nada.

`jest.setup.ts` mocka `expo-sqlite` na fronteira do próprio módulo,
`expo-widgets` em `createWidget` apenas, e o `react-native-gesture-handler`.

## Os gates

Antes de abrir um pull request:

```bash
bun run typecheck && bun run lint && bun run test:ci
```

O `lefthook` instala pelo `postinstall`, então um clone novo já vem protegido:

- **pre-commit** roda o eslint com `--max-warnings 0` nos arquivos staged e os
  testes relacionados a eles.
- **pre-push** roda `typecheck` e `test:ci` no projeto inteiro.

Os dois pulam com `--no-verify`, e nenhum dos dois substitui a checagem do pull
request. A `main` exige o check **Lint, typecheck and tests** verde, sem lista
de bypass.

## Cobertura

`test:ci` aplica os limites do `jest.config.js`:

| Escopo | Statements | Branches |
| --- | --- | --- |
| `src/lib/` | 90 | 85 |
| `src/i18n/` | 90 | 85 |
| modelos de tela (`src/features/**/hooks/**/use-*.ts`) | 90 | 85 |
| `src/components/` | 60 | - |
| `src/features/` | 60 | - |
| `src/app/` | 0 | - |
| global | 70 | - |

`src/app/` está em 0 e nomeado, não removido: sobraram só layouts, e um layout
monta um navegador nativo que o runner não renderiza. Removê-lo da lista o
afundaria no número global sem medida nenhuma. Os arquivos de rota que apenas
re-exportam uma tela estão fora do `collectCoverageFrom`, com os parênteses
escapados - um `(onboarding)` cru é lido como grupo de glob e não casa com nada.

**Um glob que não casa com nada atinge qualquer percentual.** Verde nunca é
prova suficiente quando um caminho de cobertura muda: confira no relatório que o
escopo aparece com contagem de arquivos diferente de zero.

## O que nenhum gate consegue ver

**Layout SwiftUI.** Quatro das sete telas são `@expo/ui`, e o runner nunca as
renderiza. Uma tela que compila, passa na suíte e desenha errado é possível. O
gate de build pega uma tela que não renderiza; ele não pega uma que renderiza
mal.

**Comportamento em device.** Reordenar por arrastar, notificação agendada,
atualização do widget e a versão lida em Ajustes só se verificam num aparelho.
Ao checar a versão, reinicie o dev server em vez de recarregar o JavaScript: o
`Constants.expoConfig` vem do manifesto que o dev server avaliou ao iniciar.

## Leia também

- [Arquitetura](arquitetura.md) - camadas, direção das importações, promoção
- [Convenções](convencoes.md) - nomes, tipos, estilos, tokens, comentários
- [README](../README.md)
