# Testes

Que tipos de teste existem, onde eles moram, como se chamam, e o que precisa
estar verde antes de um pull request.

[← README](../README.md) ·
[Rodando](#rodando) ·
[Os dois projetos](#os-dois-projetos) ·
[Os tipos](#os-tipos) ·
[Onde moram e como se chamam](#onde-moram-e-como-se-chamam) ·
[Como se escreve um caso](#como-se-escreve-um-caso) ·
[Snapshots](#snapshots) ·
[test-utils/](#as-ferramentas-em-test-utils) ·
[Os gates](#os-gates) ·
[Cobertura](#cobertura) ·
[O que nenhum gate vê](#o-que-nenhum-gate-consegue-ver)

---

## Rodando

```bash
bun run test          # a suíte inteira
bun run test:watch    # re-executa a cada alteração
bun run test:ci       # com cobertura, como a CI roda
```

Jest e `@testing-library/react-native`, em dois projetos: um por plataforma.
Nada precisa de device nem de simulador.

**Rode sempre por esses scripts, nunca chamando `jest` direto.** Eles fixam o
idioma e o fuso, sem os quais um resultado mudaria com a máquina que rodou:

| Variável | Valor |
| --- | --- |
| `LANG`, `LC_ALL` | `en_US.UTF-8` |
| `TZ` | `America/Sao_Paulo` |

A suíte se recusa a iniciar se eles faltarem, em `assertStableEnvironment`
(`src/test-utils/time.ts`).

O fuso não é UTC de propósito. Toda chave de data no app é meia-noite local, e
UTC esconderia exatamente o erro que isso pode causar.

---

## Os dois projetos

`jest.config.js` declara um projeto iOS e um projeto Android, cada um no preset
de plataforma do `jest-expo`. Uma execução são as duas: hoje 66 suítes no iOS,
69 no Android, 1735 casos no total.

**O motivo é cobertura, não zelo.** Sob um preset só, um arquivo `.android.tsx`
nunca é resolvido, e o `collectCoverageFrom` continua casando com ele. Toda a
superfície Android seria contada e nunca executada. A saída barata, tirar o
sufixo do glob, compra o verde escondendo o código novo do gate, que é
exatamente a armadilha do fim desta página.

O que cada projeto executa sai do sufixo do arquivo de teste:

| Arquivo | Roda em |
| --- | --- |
| `x.unit.test.ts` | Nos dois projetos |
| `x.unit.test.ios.ts` | Só no iOS |
| `x.unit.test.android.ts` | Só no Android |

Um modelo de tela não bifurca, então a suíte dele roda duas vezes e conta duas
vezes. Uma view bifurcada tem uma suíte por plataforma.

> **Uma suíte compartilhada fica errada no instante em que o módulo dela
> bifurca.** Ela afirma uma árvore que agora só existe numa das plataformas. O
> escopo dela vai para `.ios` **no mesmo commit** que cria o irmão Android, não
> no commit seguinte, para a suíte ficar verde em todo commit.

`jest.setup.ts` roda nos dois e `jest.setup.android.ts` só no Android. O
segundo existe porque três coisas não existem sob o runner: o módulo nativo do
widget, que responde a qualquer propriedade com uma exceção; as cores do
Material, que o `<Host>` pede por dentro do próprio `@expo/ui`; e a view de
símbolo, que no Android é fonte de ícone e não deixa nome nenhum na árvore. Os
três são substituídos **no módulo nativo**, que é a costura por onde o código
que vai para produção passa de qualquer jeito.

---

## Os tipos

**`unit`** cobre um módulo. É a esmagadora maioria da suíte, e inclui as telas:
uma tela é testada renderizando-a com `renderWithProviders` e afirmando o que
ela faz, não o que ela desenha.

**`integration`** cobre um fluxo que atravessa fronteiras de módulo, e mora
junto do módulo que é dono do fluxo. Existe um hoje,
`src/lib/data/store/__tests__/store.integration.test.ts`, porque o store
escreve em SQLite de verdade. O mock é o `expo-sqlite`, não o banco, então o
schema, as queries e as transações sob ele são o código que vai para produção.

---

## Onde moram e como se chamam

O `__tests__/` fica **ao lado do código que ele cobre**, o que hoje significa
dentro da pasta do hook e dentro da pasta do componente:

```
src/lib/domain/__tests__/streaks.unit.test.ts
src/lib/data/store/__tests__/store.integration.test.ts
src/components/heat-graph/__tests__/heat-graph.unit.test.tsx
src/features/today/hooks/use-today-model/__tests__/use-today-model.unit.test.ts
```

O nome é o do módulo em kebab-case, mais o tipo, mais `.test`, mais a
plataforma quando o teste é de uma só:

| Extensão | Quando |
| --- | --- |
| `.tsx` | O teste renderiza |
| `.ts` | O teste não renderiza |
| `.ios` / `.android` antes dela | O módulo coberto bifurca, ou a asserção só vale numa plataforma |

Quando um módulo muda de lugar, **o teste dele muda no mesmo commit**, para que
a suíte esteja verde em todo commit e não só no fim.

---

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

Uma asserção nomeia uma prop, uma string ou um handler que carrega significado:

| Se quebrar a suíte | O teste está |
| --- | --- |
| Mudar um rótulo, um tint, um estado desabilitado | Certo |
| Reordenar duas views irmãs | Errado, afirma forma em vez de comportamento |

**Veja o teste falhar antes de confiar nele.** Um caso escrito depois da
correção passa por construção. Guarde a correção, rode o caso, veja a falha com
a mensagem que ela deveria dar, e só então restaure.

---

## Snapshots

**Não há nenhum snapshot neste projeto**, e `find src -name "*.snap*"` não
retorna nada.

Havia quatro, das telas today, habits, habit-form e settings, somando 10.815
linhas, das quais 7.295 só no habit-form. Foram apagados e trocados por
asserções de comportamento antes de qualquer arquivo ser movido na
reorganização da v0.5. O motivo: um pull request com mil linhas de mudança real
mais dez mil linhas de snapshot regenerado não é revisado, é aprovado.

A regra que sobrou é mais estreita do que a prática antiga. **Um snapshot é
permitido apenas para um componente pequeno e estável.** Uma tela afirma
comportamento, explicitamente.

---

## As ferramentas em `test-utils/`

`src/test-utils/` está fora da cobertura e guarda o que os testes compartilham:

| Arquivo | O que oferece |
| --- | --- |
| `render.tsx` | `renderWithProviders`, que espelha a pilha de providers do layout raiz |
| `factories.ts` | `makeHabit`, `makeCompletions`, `makeAppState` |
| `time.ts` | O relógio congelado, ids estáveis, e a checagem de ambiente |
| `sqlite.ts` | O banco de teste sobre `node:sqlite` e o mock do `expo-sqlite` |
| `native-events.ts` | `tapNative`, `pressButton`, `typeInto`, `toggleSwitch`, `moveRow`, `chooseOption`, `pickDate` |
| `native-views.ts` | `symbolView`, `nativeView`, `modifier`, para achar uma view `@expo/ui` na árvore |
| `expo-router.tsx` | `expoRouterMock` |

Nenhuma tela `@expo/ui` desenha sob o runner, seja SwiftUI ou Compose. Ele vê
só os elementos que o React declarou. Por isso `native-events.ts` confere que o
alvo carrega o handler antes de disparar: uma prop renomeada falha com uma
mensagem clara em vez de virar um teste que passa sem tocar em nada.

`jest.setup.ts` mocka `expo-sqlite` na fronteira do próprio módulo,
`expo-widgets` em `createWidget` apenas, e o `react-native-gesture-handler`.
Os stand-ins que só o Android precisa estão em
[os dois projetos](#os-dois-projetos).

---

## Os gates

Antes de abrir um pull request:

```bash
bun run typecheck && bun run lint && bun run test:ci
```

O `lefthook` instala pelo `postinstall`, então um clone novo já vem protegido:

| Hook | Roda |
| --- | --- |
| `pre-commit` | ESLint com `--max-warnings 0` nos arquivos staged, e os testes relacionados a eles |
| `pre-push` | `typecheck` e `test:ci` no projeto inteiro |

Os dois pulam com `--no-verify`, e nenhum deles substitui a checagem do pull
request. A `main` exige o check **Lint, typecheck and tests** verde, sem lista
de bypass.

---

## Cobertura

`test:ci` aplica os limites do `jest.config.js`:

| Escopo | Statements | Branches |
| --- | --- | --- |
| `src/lib/` | 90 | 85 |
| `src/i18n/` | 90 | 85 |
| Modelos de tela (`src/features/**/hooks/**/use-*.ts`) | 90 | 85 |
| `src/components/` | 60 | sem limite |
| `src/features/` | 60 | sem limite |
| `src/app/` | 0 | sem limite |
| Global | 70 | sem limite |

**Os limites são da raiz, não de cada projeto**, então cada faixa mede a união
das duas execuções e os números acima querem dizer o que queriam quando havia
uma plataforma só.

`src/app/` está em 0 e nomeado, não removido. Sobraram só layouts, e um layout
monta um navegador nativo que o runner não renderiza. Removê-lo da lista o
afundaria no número global sem medida nenhuma.

Três coisas ficam fora do `collectCoverageFrom`:

| O quê | Por quê |
| --- | --- |
| As rotas que só re-exportam uma tela | Não têm o que medir. Os parênteses vão escapados: um `(onboarding)` cru é lido como grupo de glob e não casa com nada |
| `src/test-utils/` | É ferramenta de teste |
| `__tests__/` | Uma suíte `.ios.` é teste para um projeto e código sem cobertura para o outro, e foi assim que a faixa global caiu de 96 para 50 |

`widgets/` tem suítes e nenhum piso: a cobertura só olha `src/`.

> **Um glob que não casa com nada atinge qualquer percentual.** Verde nunca é
> prova suficiente quando um caminho de cobertura muda. Confira no relatório
> que o escopo aparece com contagem de arquivos diferente de zero.

---

## O que nenhum gate consegue ver

**Layout nativo, e agora são seis arquivos de tela e não quatro.** Quatro
telas são `@expo/ui` em SwiftUI no iOS, e duas delas têm um irmão em Compose no
Android. O runner não renderiza nenhum dos dois. Uma tela que compila, passa na
suíte e desenha errado é possível. O gate de build pega uma tela que não
renderiza; ele não pega uma que renderiza mal.

**Comportamento em device, nas duas plataformas.** Reordenar por arrastar,
notificação agendada, o widget e a versão lida em Ajustes só se verificam num
aparelho, e um aparelho de cada. As duas plataformas agendam lembrete por
caminhos diferentes, desenham o widget por caminhos diferentes e reordenam por
gestos diferentes, então uma verificação não vale pela outra.

O widget do Android é um bitmap, e o recorte que o launcher faz dele não é
observável em lugar nenhum além de uma tela de início de verdade.

Ao checar a versão, reinicie o dev server em vez de recarregar o JavaScript. O
`Constants.expoConfig` vem do manifesto que o dev server avaliou ao iniciar.

---

## Leia também

[Arquitetura](arquitetura.md) · [Convenções](convencoes.md) · [README](../README.md)
