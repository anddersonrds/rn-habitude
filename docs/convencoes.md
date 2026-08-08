# Convenções

As regras que valem em todo arquivo sob `src/`. São contrato, não preferência:
quando uma delas é lint, está dito; quando não é, vale igual.

[← Voltar ao README](../README.md)

## Índice

- [Nomes](#nomes)
- [Anatomia](#anatomia)
- [Onde mora um tipo](#onde-mora-um-tipo)
- [Onde mora um estilo](#onde-mora-um-estilo)
- [Tokens: `theme/`, `constants/` e `config/`](#tokens-theme-constants-e-config)
- [Estado](#estado)
- [Comentários](#comentários)
- [O alias](#o-alias)
- [Idioma](#idioma)

## Nomes

Todo arquivo e toda pasta sob `src/` é **kebab-case**, componentes e hooks
incluídos. O export mantém a convenção do que ele é:

```
src/features/today/components/habit-row/habit-row.tsx   export function HabitRow
src/features/today/hooks/use-today-model/use-today-model.ts
                                                        export function useTodayModel
```

Uma pasta é nomeada pela coisa que ela guarda, e o arquivo dentro repete esse
nome. `heat-graph/heat-graph.tsx`, não `heat-graph/component.tsx` nem
`heat-graph/HeatGraph.tsx`.

O macOS monta APFS sem diferenciar maiúscula de minúscula por padrão, e a CI
roda em Linux. Renomear só a caixa de um arquivo com `mv` deixa a mudança
invisível para o `git status` e quebra a CI. Use `git mv`, e confirme com
`git show --stat`, que imprime `{HeatGraph.tsx => heat-graph.tsx}` quando o
rename foi registrado.

## Anatomia

Uma forma só, sem exceção por tamanho. Um componente ou um hook é uma pasta:

```
stat/
  index.ts     export { Stat } from "./stat";
  stat.tsx     o componente
  types.ts     quando declara um tipo
  styles.ts    quando tem um StyleSheet
  __tests__/   os testes
```

Um arquivo ausente quer dizer que aquilo não existe, nunca que ficou inline.
`index.ts` é sempre um re-export e nunca contém lógica.

Dentro de uma feature, `hooks/` existe mesmo com um único hook, e `components/`
passa a existir com o primeiro subcomponente. Onde cada coisa mora e quando ela
sobe de camada está em [arquitetura](arquitetura.md#a-regra-de-promoção).

## Onde mora um tipo

Em `types.ts`, na pasta da coisa que ele descreve.

As props de um componente são `Props` em `types.ts`, e o componente importa
daí. Isso vale mesmo quando é uma única prop opcional.

```ts
/* src/components/stat/types.ts */
export type Props =
  | { layout?: "column"; value: string; label: string }
  | { layout: "row"; value: string; label: string; symbol: SFSymbol; color: string };
```

Tipos de domínio - `Habit`, `Completion` - moram em `src/lib/domain/types.ts`,
porque são o vocabulário do produto e não de uma tela.

`type` ou `interface`: siga o que o arquivo vizinho já usa. O código atual é
quase todo `type`.

Um estado com variantes exclusivas é uma união, não um objeto com campos
opcionais que só valem juntos. A união acima existe porque uma linha traz um
símbolo e uma coluna não pode trazer.

## Onde mora um estilo

Em `styles.ts`, na pasta do componente, num `StyleSheet.create`.

Nenhum literal de cor entra num `styles.ts`. Uma cor vem de `@/theme`; o accent
de um hábito vem do próprio hábito. `theme/colors.ts` é o único arquivo do app
que importa `Color` do `expo-router`, e ele reexporta os onze valores semânticos
por papel, não pelo nome da Apple - trocar um deles é uma linha.

Espaçamento e raio ainda têm números soltos nos estilos de `features/` e
`components/`, porque `theme/spacing.ts` só declara as métricas de layout e não
uma escala que comporte todos eles. É o único ponto em que o código não cumpre
a regra que ele mesmo estabelece, e está registrado como tal, não esquecido.

Estilo que depende de valor calculado em runtime fica inline no componente; o
resto vai para `styles.ts`.

## Tokens: `theme/`, `constants/` e `config/`

Três pastas, três perguntas diferentes:

| Pasta | Responde | Exemplos |
| --- | --- | --- |
| `theme/` | como o app **parece** | cores semânticas, tipografia, espaçamento, raio, o accent da marca, a duração da animação de lista, o tema de navegação |
| `constants/` | que **dados de domínio** o app oferece | `HABIT_COLORS`, `HABIT_ICONS`, os dias da semana |
| `config/` | quem o app **é** | o nome do app |

`HABIT_COLORS` parece aparência e não é: cada cor é gravada por hábito no
SQLite, o que a torna dado de domínio. Remover uma cor da lista muda o que já
está persistido; remover um token de `theme/` só muda o desenho.

Dentro de `theme/`: valores e adaptadores. **Um cálculo pertence a
`lib/utils/`** - é por isso que `foreground-on-color.ts`, que decide entre texto
claro e escuro a partir da luminância, mora em `utils/` e não no tema.

`components/ui/` guarda primitivas que consomem token e não carregam valor
literal nenhum. `Text` é a única hoje.

Tudo em `theme/` sai pelo barril: importe de `@/theme`, não de
`@/theme/colors`.

## Estado

`useSyncExternalStore` sobre um store fatiado por domínio, todos escrevendo por
um único `emit`. **Nenhum dado de aplicação vai para um Context**: um valor que
muda a cada check-in re-renderiza a árvore consumidora inteira, que é
exatamente o problema que o store resolve.

`useAppState` aceita um selector:

```ts
const habits = useAppState((state) => state.habits);
```

**O retorno do selector é comparado com `Object.is`.** Um selector que monta um
objeto ou um array inline devolve uma referência nova a cada chamada e entra em
loop:

```ts
/* Não: nova referência a cada render. */
const { habits, completions } = useAppState((s) => ({
  habits: s.habits,
  completions: s.completions,
}));

/* Sim: dois selectors, cada um devolvendo uma fatia. */
const habits = useAppState((s) => s.habits);
const completions = useAppState((s) => s.completions);
```

Um selector só evita render quando a fatia que ele devolve é estável. O
`loadState` preserva as referências de `habits` e `completions` que uma
releitura não mudou, então `state.habits` é estável; a raiz do `AppState`
continua sendo um objeto novo a cada emissão, e quem assina o estado inteiro
re-renderiza a cada mutação, de propósito.

Toda tela tem um `use-<x>-model`. A view não calcula.

## Comentários

**O comentário é a exceção, não o padrão.** Ele existe só onde o código não
consegue falar por si: uma decisão contraintuitiva, uma limitação de
plataforma, um motivo que o próximo leitor não tem como reconstruir. Um
comentário que repete o nome da função é ruído.

**Sempre em bloco, nunca `//`.** `/* */` para uma explicação, `/** */` quando o
editor deve mostrar o texto no hover.

Uma linha quando couber em uma linha.

```ts
/* By value, not by index: inserting a color would silently move an index. */
export const DEFAULT_HABIT_COLOR = "#34C759";
```

Comentários, como todo o resto do código, são em inglês. Veja
[Idioma](#idioma).

## O alias

`@/*` para `src/*`, `@/assets/*` para `assets/*`, e mais nenhum. Sem
`@lib/*`, sem `@features/*`.

Um alias por camada teria de ser registrado em dois lugares - `paths` no
`tsconfig.json` e `moduleNameMapper` no `jest.config.js` - e esquecer um deles
quebra só a suíte, o que é o tipo de falha que passa despercebido por um dia.
`@lib/store` também é indistinguível de um pacote npm com escopo, coisa que
`@/` nunca é. E `@/*` é o que o `create-expo-app` já entrega.

Caminho relativo só dentro da própria pasta (`./styles`, `./types`). Atravessar
para outra pasta é `@/`.

## Idioma

Português brasileiro no `README.md` e em `docs/`. **Todo o resto em inglês:**
código, nomes de arquivo, comentários, descrições de teste, mensagens de
commit, nomes de branch e o rastreador de issues.

A divisão é proposital: a prosa que explica o projeto é para quem lê, e os
artefatos que a ferramenta e o histórico do git carregam ficam na língua que o
resto do projeto já usa.

## Leia também

- [Arquitetura](arquitetura.md) - camadas, direção das importações, promoção
- [Testes](testes.md) - tipos de teste, nomes, gates, cobertura
- [README](../README.md)
