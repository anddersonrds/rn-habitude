# Arquitetura

Como o código está organizado, em que direção as importações podem apontar, e o
que o linter garante sozinho.

[← README](../README.md) ·
[As camadas](#as-camadas) ·
[Direção das importações](#direção-das-importações) ·
[A anatomia](#a-anatomia) ·
[A árvore](#a-árvore) ·
[Dentro de lib/](#dentro-de-lib) ·
[A regra de promoção](#a-regra-de-promoção) ·
[Onde mora um hook](#onde-mora-um-hook) ·
[O que o lint garante](#o-que-o-lint-garante)

---

## As camadas

```
app/          rotas e layouts: re-exportam uma tela e declaram opções de navegação
   ↓
features/     uma tela ou um fluxo completo: a view, seus subcomponentes, seu modelo
   ↓
components/   UI compartilhada: recebe props, não conhece store nem rota
   ↓
theme/   lib/   i18n/   constants/   config/
```

Cada camada só importa das que estão abaixo dela. Nada importa para cima.

`app/` é rasa de propósito. O expo-router monta a tabela de rotas com um
`require.context` sobre a pasta inteira, excluindo só `+api`, `+html` e
`+middleware`. Qualquer outro arquivo ali vira uma rota, e um barril ou um
`types.ts` vira uma rota sem export default. A tela mora em `features/`.

---

## Direção das importações

Duas regras são lint, não recomendação:

| Regra | Consequência |
| --- | --- |
| Uma feature nunca importa outra feature | O que duas features precisam desce para `lib/` ou `components/` |
| Um componente compartilhado nunca importa uma feature, a camada de dados, ou `expo-router` | Ele recebe o que precisa por prop e devolve um handler. Quem navega é a feature |

Uma terceira vale dentro de `lib/`: `lib/utils/` é puro e não importa
`lib/data/` nem `lib/native/`.

---

## A anatomia

Um componente ou um hook é sempre uma pasta, sem exceção por tamanho:

```
habit-row/
├── index.ts         re-exporta o que a pasta oferece
├── habit-row.tsx    o componente, com o mesmo nome da pasta
├── types.ts         quando declara um tipo
├── styles.ts        quando tem um StyleSheet
└── __tests__/       os testes, ao lado do código que cobrem
```

`types.ts` e `styles.ts` ausentes significam que a pasta não declara tipo nem
estilo. Nunca significam que ficaram inline no arquivo principal.

Dentro de uma feature, `hooks/` existe mesmo com um único hook, e `components/`
passa a existir assim que houver um subcomponente.

Todo arquivo sob `src/` é kebab-case, componentes e hooks incluídos. O export
mantém sua própria convenção, e isso está em
[convenções](convencoes.md#nomes).

---

## A árvore

```
src/
├── app/           rotas e layouts
├── features/      uma pasta por tela ou fluxo
├── components/    UI compartilhada
├── lib/           a lógica que não é de tela
├── theme/         aparência
├── i18n/          idioma
├── constants/     catálogo de dados de domínio
├── config/        identidade e ambiente
└── test-utils/    ferramentas de teste, fora da cobertura
```

### `app/`

```
app/
├── _layout.tsx
├── habit-form.tsx
├── habit-history.tsx
├── (onboarding)/
│   ├── _layout.tsx
│   └── index.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── (today)/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── habits/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   └── settings/
│       ├── _layout.tsx
│       └── index.tsx
└── habit/
    └── [id].tsx
```

### `features/`

`today/` está inteira aqui como referência da forma:

```
today/
├── index.ts
├── today-screen.tsx
├── styles.ts
├── components/
│   └── habit-row/
├── hooks/
│   └── use-today-model/
└── __tests__/
```

As outras seis repetem esse desenho, com uma variação prevista pela
[anatomia](#a-anatomia): `settings/` não tem `styles.ts`, porque a tela é
`@expo/ui` inteira e não declara `StyleSheet` nenhum.

| Feature | A tela | `components/` | `hooks/` |
| --- | --- | --- | --- |
| `today/` | `today-screen.tsx` | `habit-row/` | `use-today-model/` |
| `habits/` | `habits-screen.tsx` | `habit-row/`, `heat-strip/` | `use-habits-model/` |
| `habit-form/` | `habit-form-screen.tsx` | nenhum | `use-color-grid/`, `use-habit-form-model/` |
| `habit-detail/` | `habit-detail-screen.tsx` | nenhum | `use-habit-detail-model/` |
| `habit-history/` | `habit-history-screen.tsx` | `legend-swatch/` | `use-habit-history-model/` |
| `settings/` | `settings-screen.tsx` | `settings-button/`, `settings-label/` | `use-settings-model/` |
| `onboarding/` | `onboarding-flow.tsx` | `consistency-step/`, `feature-row/`, `heat-preview/`, `progress-dots/`, `reminders-step/`, `step-transition/`, `welcome-step/` | `use-onboarding-model/` |

`habit-row/` aparece em `today/` e em `habits/`, e são dois componentes
diferentes que por acaso têm o mesmo nome. Os dois são `@expo/ui`, mas o de
`today/` é uma linha de checklist com `SwipeActions` e riscado, e o de
`habits/` é uma linha reordenável com `ContextMenu` e um `HeatStrip`. Não há
código em comum para compartilhar.

### `components/`

```
components/
├── celebration/
├── empty-state/
├── heat-graph/
│   └── hooks/
│       └── use-habit-heat/
├── stat/
└── ui/
    └── text/
```

### `lib/`

```
lib/
├── domain/     habits.ts  heat.ts  streaks.ts  types.ts
├── data/       db.ts  sample-data.ts
│   └── store/  index.ts  state.ts  habits.ts  check-ins.ts
│               onboarding.ts  data.ts
├── native/     alerts.ts  haptics.ts  notification-actions.ts
│               notifications.ts  tab-bar.ts  widget-sync.ts
├── utils/      dates.ts  foreground-on-color.ts  numbers.ts  routes.ts
└── hooks/
    └── use-habit-from-route/
```

### O resto

```
theme/        animation.ts  colors.ts  index.ts
              navigation.ts  spacing.ts  typography.ts
i18n/         i18next.ts  i18n.d.ts  switching.ts  types.ts
└── locales/   de.ts  en.ts  es.ts  fr.ts  ja.ts  ko.ts  pt-br.ts  zh-hans.ts
constants/    habit-options.ts
config/       app.ts
test-utils/   expo-router.tsx  factories.ts  native-events.ts  native-views.ts
              render.tsx  sqlite.ts  time.ts
```

Fora de `src/`:

```
docs/       esta documentação
widgets/    o widget da tela de início, em componentes Expo UI
plugins/    config plugins do build nativo
patches/    correções aplicadas sobre dependências
assets/     ícone do app e imagens
.github/    o workflow de CI
```

`ios/` não aparece na lista porque não é versionado. Ele é gerado a partir do
`app.config.js` e dos config plugins no primeiro build.

**`src/hooks/` não existe, e isso é proposital.** A pasta não é criada vazia:
ela aparece com o primeiro hook promovido para lá. Veja
[a regra de promoção](#a-regra-de-promoção).

---

## Dentro de `lib/`

Quatro camadas por dependência, mais uma pasta de hooks:

| Pasta | O que guarda | Do que depende |
| --- | --- | --- |
| `domain/` | As regras do produto: streak, mapa de calor, tipos de hábito | Nada além de `utils/` |
| `data/` | SQLite: o banco, o store e o seed | `domain/` |
| `native/` | A plataforma: notificações, háptico, widget, alertas, tab bar | As APIs do Expo |
| `utils/` | Helpers puros: datas, números, cores, rotas tipadas | Nada |
| `hooks/` | Um hook compartilhado que não cabe em nenhuma das quatro | O que ele precisar |

`utils/` ser puro é lint. As outras três são convenção.

Duas entradas da tabela merecem explicação, porque quem lê a lista de camadas
esperando quatro pastas encontra cinco:

**`hooks/use-habit-from-route/`** é a guarda de hábito ausente, usada por duas
telas. Ela importa `expo-router` e a lista de hábitos, então não é pura, não é
domínio, não é dado e não é plataforma. Não cabe em nenhuma das quatro.

**`native/alerts.ts`** conta como ligação com a plataforma porque
`Alert.alert` e `Linking.openURL("app-settings:")` são a plataforma e mais
nada.

---

## A regra de promoção

Um componente ou um hook **nasce dentro da feature que precisa dele**. Ele se
move para `src/components/` ou `src/hooks/` quando cumpre as duas condições ao
mesmo tempo:

1. Tem um segundo consumidor.
2. Não toca no store, nem em rota, nem em texto de domínio.

Um consumidor só não promove nada. É por isso que `legend-swatch/` continua
dentro de `habit-history/`.

Se a coisa depende do store, **promove-se a metade pura e a metade conectada
fica**. É o que separa `components/heat-graph/`, que recebe uma matriz por
prop, do modelo da tela que a calcula.

---

## Onde mora um hook

O modelo de uma tela pertence à feature dela. `use-today-model/` fica em
`features/today/hooks/`.

Um hook que é **a cara React de um módulo** mora com o módulo, não numa pasta
de hooks:

| Hook | Mora com |
| --- | --- |
| `useAppState` | O store |
| `useTabBarHidden` | `setTabBarHidden` |
| `useNotificationActions` | O módulo de notificações |

Uma pasta global de hooks classificaria por tipo de arquivo, que é o oposto de
classificar por direção.

Toda tela tem um `use-<x>-model`. A view não calcula.

---

## O que o lint garante

`import/no-restricted-paths` em `eslint.config.js` declara as zonas:

| Zona | Regra |
| --- | --- |
| Uma por feature | `features/<x>` não importa de `features/` exceto de si mesma |
| `components/` | Não importa de `features/` nem de `lib/data/` |
| `lib/utils/` | Não importa de `lib/data/` nem de `lib/native/` |

`no-restricted-imports` sobre `src/components/**` proíbe `expo-router`.

Dois detalhes da configuração existem para a regra não morrer sozinha:

| O quê | Por quê |
| --- | --- |
| `eslint-import-resolver-typescript` | O resolver padrão não segue `@/*`, e a regra de zonas não diz nada sobre um caminho que não conseguiu resolver |
| `eslint-plugin-import` como dependência direta | Se fosse transitiva do `eslint-config-expo`, uma atualização removeria a regra em silêncio |

### E o que ele não garante

Três convenções o linter não consegue cobrir, e elas valem igual:

**`Color` do `expo-router` só entra pelo `theme/`.** A proibição de importar
`expo-router` só existe sob `src/components/`, porque uma feature importa
`Stack`, `Link` e `router` do mesmo pacote. Em `src/features/` e `src/app/` a
regra é convenção: `theme/colors.ts` é o único arquivo do app que importa
`Color`.

**Nenhum número solto de espaçamento.** O varrimento de hexadecimais foi feito.
O de espaçamento não, e `theme/spacing.ts` ainda não tem uma escala que
comporte os valores usados hoje.

**Nenhum objeto inline no selector do `useAppState`.** O `useSyncExternalStore`
compara o retorno com `Object.is`, então um selector que monta um objeto a cada
chamada entra em loop. Veja [convenções](convencoes.md#estado).

> **Uma zona morta é uma zona verde.** Quando uma zona de lint aponta para um
> caminho que não existe mais, ela deixa de proteger qualquer coisa e o lint
> continua passando, porque não sobrou nada para a regra casar. Mover uma pasta
> e reescrever a zona pertencem ao mesmo commit.

---

## Leia também

[Convenções](convencoes.md) · [Testes](testes.md) · [README](../README.md)
