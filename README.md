# habitude

Um rastreador de hábitos diários para iOS, local-first. Habit + attitude: marque
as coisas pequenas e veja o padrão se formar.

## Índice

- [O que é](#o-que-é)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Rodando](#rodando)
- [Estrutura](#estrutura)
- [Testes](#testes)
- [Documentação](#documentação)
- [Limitações conhecidas](#limitações-conhecidas)

## O que é

Um app de hábitos que roda inteiro no aparelho. Tudo mora num banco SQLite
local: sem conta, sem rede, sem pagamento. Nada sai do iPhone.

As telas são nativas de verdade onde faz diferença - a lista de hábitos, o
formulário, os ajustes e o onboarding são SwiftUI via `@expo/ui` - e o resto é
React Native.

O app fala oito idiomas: alemão, chinês simplificado, coreano, espanhol,
francês, inglês, japonês e português do Brasil.

## Funcionalidades

- **Hoje** - os hábitos do dia como uma lista de marcar, com barra de progresso e
  uma comemoração quando tudo é concluído.
- **Hábitos** - uma lista SwiftUI que você reordena arrastando, cada linha
  mostrando o streak e um mapa de calor de três semanas.
- **Histórico** - um mapa de calor por hábito no estilo GitHub, na cor do
  próprio hábito, com streak atual, melhor streak e taxa de conclusão.
- **Lembretes** - notificações locais por hábito, com uma ação "Check in" que
  marca sem abrir o app.
- **Widget** - o mesmo mapa de calor na tela de início, atualizado a cada
  check-in.

## Stack

Expo SDK 57 com Expo Router, `@expo/ui` para as telas SwiftUI nativas,
`expo-widgets` para o widget da tela de início, `expo-sqlite` para persistência,
`expo-notifications` para os lembretes, `expo-symbols` para os SF Symbols,
`expo-glass-effect` para o Liquid Glass, `i18next` para os idiomas e Reanimated
para as transições.

TypeScript em modo estrito. ESLint sobre a config do Expo, mais as regras de
fronteira entre camadas.

## Requisitos

- Xcode 26 ou mais novo, SDK do iOS 26
- Um iPhone físico ou um simulador de iOS 26
- [Bun](https://bun.sh) - o lockfile é o `bun.lock`
- Node 24 ou mais novo. O Bun roda os scripts, mas a suíte de testes apoia o
  `expo-sqlite` no `node:sqlite`, que é um builtin do Node e o Bun não carrega.

## Rodando

```bash
bun install
npx expo run:ios --device
```

O primeiro build compila o projeto nativo incluindo a extensão do widget, então
demora. Os seguintes reaproveitam.

Outros scripts:

```bash
bun run start            # o dev server
bun run ios              # build e run no simulador
bun run ios:widget       # build incluindo a extensão do widget
bun run prebuild:widget  # regenera o projeto nativo do zero
bun run lint             # eslint, com warning tratado como erro
bun run typecheck        # tsc --noEmit
```

O `lefthook` instala pelo `postinstall`, então um clone novo já vem protegido:
commitar roda lint e os testes relacionados aos arquivos staged, e dar push roda
typecheck e a suíte inteira. Os dois pulam com `--no-verify`, e nenhum deles
substitui a checagem do pull request.

## Estrutura

```
src/
  app/          rotas e layouts do expo-router
  features/     uma pasta por tela ou fluxo, completa
  components/   UI compartilhada, sem store e sem rota
  lib/          domínio, dados, plataforma e helpers puros
  theme/        cores, tipografia, espaçamento, animação, tema de navegação
  i18n/         a configuração e os oito catálogos
  constants/    catálogo de dados de domínio: cores e ícones de hábito
  config/       identidade do app
  test-utils/   factories, relógio, providers, helpers de interação
docs/           a documentação profunda, em português
widgets/        o widget da tela de início, em componentes Expo UI
plugins/        config plugins do build nativo
patches/        correções aplicadas sobre dependências
assets/         ícone do app e imagens
.github/        o workflow de CI
```

`ios/` aparece depois do primeiro build e não é versionado: ele é gerado a
partir do `app.config.js` e dos config plugins.

As camadas importam só para baixo, e duas dessas fronteiras são lint e não
recomendação. Onde colocar uma tela nova, um componente novo ou um hook novo
está em [docs/arquitetura.md](docs/arquitetura.md).

## Testes

```bash
bun run test          # a suíte inteira
bun run test:watch    # re-executa a cada alteração
bun run test:ci       # com cobertura, como a CI roda
```

Jest com o preset `jest-expo/ios` e `@testing-library/react-native`. Nada
precisa de device nem de simulador.

Rode sempre por esses scripts, nunca chamando `jest` direto: eles fixam o idioma
e o fuso, sem os quais um resultado mudaria com a máquina que rodou, e a suíte
se recusa a iniciar se eles faltarem.

Os testes ficam num `__tests__/` ao lado do código que cobrem, nomeados pelo
módulo em kebab-case mais o tipo:

```
src/lib/domain/__tests__/streaks.unit.test.ts
src/components/heat-graph/__tests__/heat-graph.unit.test.tsx
```

O resto - tipos de teste, como escrever um caso, quando um snapshot é permitido,
os gates e as faixas de cobertura - está em [docs/testes.md](docs/testes.md).

## Documentação

- [docs/arquitetura.md](docs/arquitetura.md) - as camadas, a direção das
  importações, a anatomia completa das pastas, a regra de promoção e o que o
  linter garante
- [docs/convencoes.md](docs/convencoes.md) - nomes, onde mora um tipo, onde mora
  um estilo, as fronteiras entre `theme/`, `constants/` e `config/`, o estado, os
  comentários e o alias
- [docs/testes.md](docs/testes.md) - tipos de teste, nomes, snapshots, os gates e
  a cobertura

O README e o `docs/` são em português. Todo o resto é em inglês: código,
comentários, descrições de teste, mensagens de commit e nomes de branch.

## Limitações conhecidas

- **Só iOS.** Não existe caminho de código para Android.
- **`src/hooks/` não existe.** A pasta não é criada vazia; ela aparece com o
  primeiro hook promovido para lá. Veja a regra de promoção em
  [docs/arquitetura.md](docs/arquitetura.md#a-regra-de-promoção).
- **O widget não compartilha código com o app.** O plugin de widgets do
  `babel-preset-expo` transforma o corpo da função numa string avaliada em outro
  bundle, sem grafo de módulos, então ele não consegue importar o que renderiza.
  A cor de destaque dele é uma cópia manual pelo mesmo motivo.
- **Layout SwiftUI não é coberto por nenhum gate.** O runner não renderiza
  `@expo/ui`, então uma tela pode compilar, passar na suíte e desenhar errado.
- **Nomes de hábito de exemplo congelam no idioma em que foram criados.** Eles
  são linhas no SQLite, então trocar o idioma depois não os traduz.
- **`patches/expo-modules-jsi@57.0.4.patch`** contorna um erro de compilação do
  Swift 6.2 nesse pacote (`abs(_:)` é ambíguo dentro de um `guard`), trocando a
  chamada pelo `.magnitude` equivalente. Remova quando o upstream corrigir.
