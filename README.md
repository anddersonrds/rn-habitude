# habitude

Rastreador de hábitos diários para iOS, local-first. *Habit* + *attitude*:
marque as coisas pequenas e veja o padrão se formar.

[O que é](#o-que-é) ·
[Funcionalidades](#funcionalidades) ·
[Stack](#stack) ·
[Requisitos](#requisitos) ·
[Rodando](#rodando) ·
[Estrutura](#estrutura) ·
[Testes](#testes) ·
[Documentação](#documentação) ·
[Limitações](#limitações-conhecidas)

---

## O que é

O app roda inteiro no aparelho. Tudo mora num banco SQLite local: sem conta,
sem rede, sem pagamento. Nada sai do iPhone.

As telas são nativas de verdade onde isso faz diferença. Quatro das sete são
SwiftUI via `@expo/ui`, e as outras três são React Native:

| SwiftUI, via `@expo/ui` | React Native |
| --- | --- |
| Hoje, hábitos, formulário, ajustes | Onboarding, histórico, detalhe do hábito |

Fala oito idiomas, resolvidos a partir do idioma do aparelho na primeira
abertura: alemão, chinês simplificado, coreano, espanhol, francês, inglês,
japonês e português do Brasil.

---

## Funcionalidades

| Tela | O que faz |
| --- | --- |
| **Hoje** | Os hábitos do dia como lista de marcar, com barra de progresso e uma comemoração ao completar tudo. |
| **Hábitos** | Lista SwiftUI reordenável por arrastar. Cada linha traz o streak e um mapa de calor de três semanas. |
| **Histórico** | Mapa de calor por hábito no estilo GitHub, na cor do próprio hábito, com streak atual, melhor streak e taxa de conclusão. |
| **Lembretes** | Notificação local por hábito, com uma ação "Check in" que marca sem abrir o app. |
| **Widget** | O mesmo mapa de calor na tela de início, atualizado a cada check-in. |

---

## Stack

| Pacote | Para quê |
| --- | --- |
| `expo` SDK 57, `expo-router` | Runtime e navegação |
| `@expo/ui` | As telas SwiftUI nativas |
| `expo-symbols` | Os SF Symbols |
| `expo-glass-effect` | O Liquid Glass |
| `expo-sqlite` | Persistência |
| `expo-notifications` | Os lembretes |
| `expo-widgets` | O widget da tela de início |
| `i18next`, `react-i18next`, `expo-localization` | Os oito idiomas |
| `react-native-reanimated` | As transições |

TypeScript em modo estrito. ESLint sobre a config do Expo, mais as regras de
fronteira entre camadas.

---

## Requisitos

| O quê | Versão |
| --- | --- |
| Xcode | 26 ou mais novo, com o SDK do iOS 26 |
| Aparelho | Um iPhone físico ou um simulador de iOS 26 |
| [Bun](https://bun.sh) | O lockfile é o `bun.lock` |
| Node | 24 ou mais novo |

O Bun roda os scripts, mas a suíte de testes apoia o `expo-sqlite` no
`node:sqlite`, que é um builtin do Node e o Bun não carrega. Por isso os dois.

---

## Rodando

```bash
bun install
npx expo run:ios --device
```

O primeiro build compila o projeto nativo inteiro, incluindo a extensão do
widget, então demora. Os seguintes reaproveitam.

### Scripts

| Script | O que faz |
| --- | --- |
| `bun run start` | O dev server |
| `bun run ios` | Build e run no simulador |
| `bun run ios:device` | Build e run num iPhone conectado |
| `bun run ios:widget` | Build incluindo a extensão do widget |
| `bun run prebuild:widget` | Regenera o projeto nativo do zero |
| `bun run lint` | ESLint, com warning tratado como erro |
| `bun run typecheck` | `tsc --noEmit` |

### Hooks de git

O `lefthook` instala pelo `postinstall`, então um clone novo já vem protegido:

| Hook | Roda |
| --- | --- |
| `pre-commit` | ESLint e os testes relacionados aos arquivos staged |
| `pre-push` | `typecheck` e a suíte inteira com cobertura |

Os dois pulam com `--no-verify`, e nenhum deles substitui a checagem do pull
request.

---

## Estrutura

```
habitude/
├── src/
│   ├── app/           rotas e layouts do expo-router, nada além disso
│   ├── features/      uma pasta por tela ou fluxo, completa
│   ├── components/    UI compartilhada, sem store e sem rota
│   ├── lib/           domínio, dados, plataforma e helpers puros
│   ├── theme/         cores, tipografia, espaçamento, animação, navegação
│   ├── i18n/          a configuração e os oito catálogos
│   ├── constants/     dados de domínio: cores e ícones de hábito
│   ├── config/        identidade do app
│   └── test-utils/    factories, relógio, providers, helpers de interação
├── docs/              a documentação profunda, em português
├── widgets/           o widget da tela de início, em componentes Expo UI
├── plugins/           config plugins do build nativo
├── patches/           correções aplicadas sobre dependências
├── assets/            ícone do app e imagens
└── .github/           o workflow de CI
```

`ios/` aparece depois do primeiro build e não é versionado. Ele é gerado a
partir do `app.config.js` e dos config plugins.

As camadas importam só para baixo, e duas dessas fronteiras são lint, não
recomendação. Onde colocar uma tela, um componente ou um hook novo está em
[docs/arquitetura.md](docs/arquitetura.md).

---

## Testes

```bash
bun run test          # a suíte inteira
bun run test:watch    # re-executa a cada alteração
bun run test:ci       # com cobertura, como a CI roda
```

Jest com o preset `jest-expo/ios` e `@testing-library/react-native`. Nada
precisa de device nem de simulador.

**Rode sempre por esses scripts, nunca chamando `jest` direto.** Eles fixam o
idioma e o fuso, sem os quais um resultado mudaria com a máquina que rodou, e a
suíte se recusa a iniciar se eles faltarem.

Os testes ficam num `__tests__/` ao lado do código que cobrem, nomeados pelo
módulo em kebab-case mais o tipo:

```
src/lib/domain/__tests__/streaks.unit.test.ts
src/components/heat-graph/__tests__/heat-graph.unit.test.tsx
```

Tipos de teste, como escrever um caso, quando um snapshot é permitido, os gates
e as faixas de cobertura estão em [docs/testes.md](docs/testes.md).

---

## Documentação

| Documento | Cobre |
| --- | --- |
| [Arquitetura](docs/arquitetura.md) | As camadas, a direção das importações, a árvore completa, a regra de promoção, o que o lint garante |
| [Convenções](docs/convencoes.md) | Nomes, onde mora um tipo, onde mora um estilo, a fronteira entre `theme/`, `constants/` e `config/`, o estado, os comentários, o alias |
| [Testes](docs/testes.md) | Tipos de teste, nomes, snapshots, os gates, a cobertura |

O README e o `docs/` são em português. Todo o resto é em inglês: código,
comentários, descrições de teste, mensagens de commit e nomes de branch.

---

## Limitações conhecidas

**Só iOS.** Não existe caminho de código para Android.

**`src/hooks/` não existe.** A pasta não é criada vazia. Ela aparece com o
primeiro hook promovido para lá, e a regra de promoção está em
[docs/arquitetura.md](docs/arquitetura.md#a-regra-de-promoção).

**O widget não compartilha código com o app.** O plugin de widgets do
`babel-preset-expo` transforma o corpo da função numa string avaliada em outro
bundle, sem grafo de módulos, então ele não consegue importar o que renderiza.
A cor de destaque dele é uma cópia manual pelo mesmo motivo.

**Layout SwiftUI não é coberto por nenhum gate.** O runner não renderiza
`@expo/ui`, então uma tela pode compilar, passar na suíte e desenhar errado.

**Nomes de hábito de exemplo congelam no idioma em que foram criados.** Eles
são linhas no SQLite, e trocar o idioma depois não os traduz.

**Espaçamento e raio ainda têm números soltos nos estilos.** `theme/spacing.ts`
declara cinco métricas de layout, não uma escala. É o único ponto em que o
código não cumpre a regra que ele mesmo estabelece.

**`patches/expo-modules-jsi@57.0.4.patch`** contorna um erro de compilação do
Swift 6.2 nesse pacote, onde `abs(_:)` fica ambíguo dentro de um `guard`,
trocando a chamada pelo `.magnitude` equivalente. Remova quando o upstream
corrigir.
