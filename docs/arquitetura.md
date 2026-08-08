# Arquitetura

Como o código está organizado, em que direção as importações podem apontar, e o
que o linter garante sozinho.

[← Voltar ao README](../README.md)

## Índice

- [As camadas](#as-camadas)
- [A direção das importações](#a-direção-das-importações)
- [A anatomia](#a-anatomia)
- [A árvore completa](#a-árvore-completa)
- [Dentro de `lib/`](#dentro-de-lib)
- [A regra de promoção](#a-regra-de-promoção)
- [Onde mora um hook](#onde-mora-um-hook)
- [O que o lint garante e o que ele não garante](#o-que-o-lint-garante-e-o-que-ele-não-garante)

## As camadas

```
app/         rotas e layouts: só re-exportam uma tela e declaram opções de navegação
  ↓
features/    uma tela ou um fluxo, completo: a view, seus subcomponentes e seu modelo
  ↓
components/  UI compartilhada: recebe props, não conhece store nem rota
  ↓
theme/  lib/  i18n/  constants/  config/
```

Cada camada só importa das que estão abaixo dela. Nada importa para cima.

`app/` existe porque o expo-router monta a tabela de rotas a partir de um
`require.context` sobre a pasta inteira, excluindo apenas `+api`, `+html` e
`+middleware`. Qualquer outro arquivo colocado ali vira uma rota, e um barril
ou um arquivo de tipos vira uma rota sem export default. Por isso `app/` guarda
só rota e layout, e a tela de verdade mora em `features/`.

## A direção das importações

Duas regras são lint, não recomendação:

- **Uma feature nunca importa outra feature.** O que duas features precisam
  desce para `lib/` ou para `components/`.
- **Um componente compartilhado nunca importa uma feature, nem a camada de
  dados, nem `expo-router`.** Ele recebe o que precisa por prop e devolve um
  handler. Quem navega é a feature.

Uma terceira regra vale dentro de `lib/`: `lib/utils/` é puro e não importa
`lib/data/` nem `lib/native/`.

## A anatomia

Um componente ou um hook é sempre uma pasta, sem exceção por tamanho:

```
habit-row/
  index.ts        re-exporta o que a pasta oferece
  habit-row.tsx   o componente, com o mesmo nome da pasta
  types.ts        quando declara um tipo
  styles.ts       quando tem um StyleSheet
  __tests__/      os testes, ao lado do código que cobrem
```

`types.ts` e `styles.ts` ausentes significam que a pasta não declara tipo nem
estilo. Nunca significam que ficaram inline no arquivo principal.

Dentro de uma feature, `hooks/` existe mesmo com um único hook, e `components/`
passa a existir assim que houver um subcomponente.

Todo arquivo sob `src/` é kebab-case, componentes e hooks incluídos. O export
mantém sua própria convenção: PascalCase para componente, camelCase para hook.

## A árvore completa

```
src/
  app/                              rotas e layouts
    _layout.tsx
    habit-form.tsx
    habit-history.tsx
    (onboarding)/
      _layout.tsx
      index.tsx
    (tabs)/
      _layout.tsx
      (today)/
        _layout.tsx
        index.tsx
      habits/
        _layout.tsx
        index.tsx
      settings/
        _layout.tsx
        index.tsx
    habit/
      [id].tsx

  features/                         uma pasta por tela ou fluxo
    today/
      index.ts
      today-screen.tsx
      styles.ts
      components/
        habit-row/
      hooks/
        use-today-model/
      __tests__/
    habits/
      components/  habit-row/, heat-strip/
      hooks/       use-habits-model/
    habit-form/
      hooks/       use-color-grid/, use-habit-form-model/
    habit-detail/
      hooks/       use-habit-detail-model/
    habit-history/
      components/  legend-swatch/
      hooks/       use-habit-history-model/
    settings/
      components/  settings-button/, settings-label/
      hooks/       use-settings-model/
    onboarding/
      components/  consistency-step/, feature-row/, heat-preview/,
                   progress-dots/, reminders-step/, step-transition/,
                   welcome-step/
      hooks/       use-onboarding-model/

  components/                       UI compartilhada
    celebration/
    empty-state/
    heat-graph/
      hooks/
        use-habit-heat/
    stat/
    ui/
      text/

  lib/                              a lógica que não é de tela
    domain/
      habits.ts  heat.ts  streaks.ts  types.ts
    data/
      db.ts  sample-data.ts
      store/
        index.ts  state.ts  habits.ts  check-ins.ts  onboarding.ts  data.ts
    native/
      alerts.ts  haptics.ts  notification-actions.ts  notifications.ts
      tab-bar.ts  widget-sync.ts
    utils/
      dates.ts  foreground-on-color.ts  numbers.ts  routes.ts
    hooks/
      use-habit-from-route/

  theme/                            aparência
    animation.ts  colors.ts  index.ts  navigation.ts  spacing.ts  typography.ts

  i18n/                             idioma
    i18next.ts  i18n.d.ts  switching.ts  types.ts
    locales/
      de.ts  en.ts  es.ts  fr.ts  ja.ts  ko.ts  pt-br.ts  zh-hans.ts

  constants/                        catálogo de dados de domínio
    habit-options.ts

  config/                           identidade e ambiente
    app.ts

  test-utils/                       ferramentas de teste, fora da cobertura
    expo-router.tsx  factories.ts  native-events.ts  native-views.ts
    render.tsx  sqlite.ts  time.ts
```

Fora de `src/`:

```
widgets/    o widget da tela de início, em componentes Expo UI
plugins/    config plugins do build nativo
assets/     ícone do app e imagens
ios/        o projeto nativo gerado
patches/    correções aplicadas sobre dependências
```

**`src/hooks/` não existe, e isso é proposital.** Ele não é criado vazio à
espera do primeiro hook: ele aparece no dia em que um hook for promovido para
lá, e não antes. Uma pasta vazia declara uma intenção que ninguém verificou;
essa aqui só passa a existir com conteúdo que ganhou o direito de estar nela.
Veja [A regra de promoção](#a-regra-de-promoção).

## Dentro de `lib/`

Quatro camadas por dependência, mais uma pasta de hooks:

| Pasta | O que guarda | Do que depende |
| --- | --- | --- |
| `domain/` | as regras do produto: streak, mapa de calor, tipos de hábito | nada além de `utils/` |
| `data/` | SQLite: o banco, o store e o seed | `domain/` |
| `native/` | a plataforma: notificações, háptico, widget, alertas, tab bar | as APIs do Expo |
| `utils/` | helpers puros: datas, números, cores, rotas tipadas | nada |
| `hooks/` | um hook compartilhado que não cabe em nenhuma das quatro | o que ele precisar |

`utils/` ser puro é lint. As outras três são convenção.

Duas coisas na tabela merecem explicação, porque quem lê a lista de camadas
esperando quatro pastas encontra cinco:

**`hooks/use-habit-from-route/`** é a guarda de hábito ausente, usada por duas
telas. Ela importa `expo-router` e a lista de hábitos, então não é pura, não é
domínio, não é dado e não é uma ligação com a plataforma. Não cabe em nenhuma
das quatro, e inventar uma quinta camada para um único hook seria pior do que
deixá-lo numa pasta com o nome do que ele é.

**`native/alerts.ts`** é a sexta ligação com a plataforma porque
`Alert.alert` e `Linking.openURL("app-settings:")` são a plataforma e mais nada.

## A regra de promoção

Um componente ou um hook **nasce dentro da feature que precisa dele**. Ele se
move para `src/components/` ou `src/hooks/` quando cumpre as duas condições ao
mesmo tempo:

1. tem um segundo consumidor, e
2. não toca no store, nem em rota, nem em texto de domínio.

Um consumidor só não promove nada. `legend-swatch/` continua dentro de
`habit-history/` por isso.

Se a coisa depende do store, **promove-se a metade pura e a metade conectada
fica**. É o que separa `components/heat-graph/`, que recebe uma matriz por prop,
do modelo da tela que a calcula.

## Onde mora um hook

O modelo de uma tela pertence à feature dela: `use-today-model/` fica em
`features/today/hooks/`.

Um hook que é **a cara React de um módulo** mora com o módulo, não numa pasta de
hooks: `useAppState` com o store, `useTabBarHidden` com `setTabBarHidden`,
`useNotificationActions` com o módulo de notificações. Uma pasta global de hooks
classificaria por tipo de arquivo, que é o oposto de classificar por direção.

Toda tela tem um `use-<x>-model`. A view não calcula.

## O que o lint garante e o que ele não garante

`import/no-restricted-paths` em `eslint.config.js` declara as zonas:

| Zona | Regra |
| --- | --- |
| uma por feature | `features/<x>` não importa de `features/` exceto de si mesma |
| `components/` | não importa de `features/` nem de `lib/data/` |
| `lib/utils/` | não importa de `lib/data/` nem de `lib/native/` |

`no-restricted-imports` sobre `src/components/**` proíbe `expo-router`.

A resolução passa pelo `eslint-import-resolver-typescript`, porque o resolver
padrão não segue `@/*` e a regra de zonas não diz nada sobre um caminho que ela
não conseguiu resolver. `eslint-plugin-import` é uma dependência direta e não
uma transitiva do `eslint-config-expo`, para que uma atualização não remova a
regra em silêncio.

**Três convenções o linter não consegue cobrir**, e elas valem igual:

- **`Color` do `expo-router` só entra pelo `theme/`.** A proibição de importar
  `expo-router` só existe sob `src/components/`, porque uma feature importa
  `Stack`, `Link` e `router` do mesmo pacote. Em `src/features/` e `src/app/` a
  regra é convenção: `theme/colors.ts` é o único arquivo do app que importa
  `Color`.
- **Nenhum número solto de espaçamento.** O varrimento de hexadecimais foi feito;
  o de espaçamento não, e `theme/spacing.ts` ainda não tem uma escala que
  comporte os valores usados hoje.
- **Nenhum objeto inline no selector do `useAppState`.** O
  `useSyncExternalStore` compara o retorno com `Object.is`, então um selector que
  monta um objeto a cada chamada entra em loop. Veja
  [convenções](convencoes.md#estado).

Quando uma zona de lint aponta para um caminho que não existe mais, ela deixa de
proteger qualquer coisa e o lint continua verde, porque não sobrou nada para a
regra casar. Mover uma pasta e reescrever a zona pertencem ao mesmo commit.

## Leia também

- [Convenções](convencoes.md) - nomes, tipos, estilos, tokens, comentários
- [Testes](testes.md) - tipos de teste, nomes, gates, cobertura
- [README](../README.md)
