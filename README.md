# habitude

Rastreador de hábitos diários para iOS e Android, local-first. *Habit* +
*attitude*: marque as coisas pequenas e veja o padrão se formar.

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
sem rede, sem pagamento. Nada sai do aparelho.

As telas são nativas de verdade onde isso faz diferença, e cada plataforma
desenha com o que ela tem:

| Tela | iOS | Android |
| --- | --- | --- |
| Hoje, ajustes | SwiftUI, via `@expo/ui` | Jetpack Compose, via `@expo/ui` |
| Hábitos, formulário | SwiftUI, via `@expo/ui` | React Native |
| Onboarding, histórico, detalhe | React Native | React Native |

O mesmo banco, o mesmo modelo por trás de cada tela e o mesmo catálogo de
ícones nos dois lados. Um hábito criado no iPhone abre no Android com o ícone,
a cor e a agenda intactos. A regra completa de quando uma tela ganha um irmão
de plataforma está em
[docs/arquitetura.md](docs/arquitetura.md#as-duas-plataformas).

Fala oito idiomas, resolvidos a partir do idioma do aparelho na primeira
abertura: alemão, chinês simplificado, coreano, espanhol, francês, inglês,
japonês e português do Brasil.

---

## Funcionalidades

| Tela | O que faz |
| --- | --- |
| **Hoje** | Os hábitos do dia como lista de marcar, com barra de progresso e uma comemoração ao completar tudo. |
| **Hábitos** | Lista reordenável por arrastar. Cada linha traz o streak e um mapa de calor de três semanas. |
| **Histórico** | Mapa de calor por hábito no estilo GitHub, na cor do próprio hábito, com streak atual, melhor streak e taxa de conclusão. |
| **Lembretes** | Notificação local por hábito, com uma ação "Check in" que marca sem abrir o app. |
| **Widget** | O mesmo mapa de calor na tela de início, atualizado a cada check-in. |

---

## Stack

| Pacote | Para quê |
| --- | --- |
| `expo` SDK 57, `expo-router` | Runtime e navegação |
| `@expo/ui` | As telas nativas: SwiftUI no iOS, Jetpack Compose no Android |
| `expo-symbols` | Os símbolos, SF no iOS e Material no Android |
| `expo-glass-effect` | O Liquid Glass, só no iOS |
| `expo-sqlite` | Persistência |
| `expo-notifications` | Os lembretes, por canal no Android |
| `expo-widgets` | O widget da tela de início no iOS |
| `react-native-android-widget` | O widget da tela de início no Android |
| `i18next`, `react-i18next`, `expo-localization` | Os oito idiomas |
| `react-native-reanimated`, `react-native-gesture-handler` | As transições e o arrastar para reordenar |

TypeScript em modo estrito. ESLint sobre a config do Expo, mais as regras de
fronteira entre camadas.

---

## Requisitos

| O quê | Versão |
| --- | --- |
| [Bun](https://bun.sh) | O lockfile é o `bun.lock` |
| Node | 24 ou mais novo |
| Xcode, para iOS | 26 ou mais novo, com o SDK do iOS 26 |
| Android Studio, para Android | Com o SDK 36 e a JDK 17 |
| Aparelho | Um iPhone ou um simulador de iOS 26, um telefone Android ou um emulador |

O Bun roda os scripts, mas a suíte de testes apoia o `expo-sqlite` no
`node:sqlite`, que é um builtin do Node e o Bun não carrega. Por isso os dois.

Uma das duas plataformas basta para desenvolver. Nenhum gate depende de ter as
duas, e a suíte roda sem nenhuma.

---

## Rodando

```bash
bun install
bun run ios:device       # ou android:device
```

O primeiro build compila o projeto nativo inteiro, então demora. Os seguintes
reaproveitam.

### Scripts

| Script | O que faz |
| --- | --- |
| `bun run start` | O dev server |
| `bun run ios` | Build e run no simulador |
| `bun run ios:device` | Build e run num iPhone conectado |
| `bun run ios:widget` | Build incluindo a extensão do widget |
| `bun run android` | Build e run no emulador |
| `bun run android:device` | Build e run num telefone conectado |
| `bun run prebuild:widget` | Regenera o projeto nativo iOS do zero |
| `bun run lint` | ESLint, com warning tratado como erro |
| `bun run typecheck` | `tsc --noEmit` |

O widget do Android vem em qualquer build; o do iOS fica atrás de
`HABITUDE_WIDGET=1`, porque a extensão precisa de um App Group e ele precisa de
conta paga da Apple.

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
├── index.ts           a entrada do app, antes do expo-router
├── docs/              a documentação profunda, em português
├── widgets/           o widget da tela de início, um por plataforma
├── plugins/           config plugins do build nativo
├── patches/           correções aplicadas sobre dependências
├── assets/            ícone do app e imagens
└── .github/           o workflow de CI
```

`ios/` e `android/` aparecem depois do primeiro build e não são versionados.
Os dois são gerados a partir do `app.config.js` e dos config plugins.

O arquivo de uma tela ganha um irmão `.android` quando o desenho muda de
plataforma, e o modelo por trás dela nunca ganha. As camadas importam só para
baixo, e duas dessas fronteiras são lint, não recomendação. Onde colocar uma
tela, um componente ou um hook novo está em
[docs/arquitetura.md](docs/arquitetura.md).

---

## Testes

```bash
bun run test          # a suíte inteira
bun run test:watch    # re-executa a cada alteração
bun run test:ci       # com cobertura, como a CI roda
```

Jest e `@testing-library/react-native`, em dois projetos: um por plataforma,
porque um arquivo `.android.tsx` nunca é resolvido sob o preset do iOS. Nada
precisa de device nem de simulador.

**Rode sempre por esses scripts, nunca chamando `jest` direto.** Eles fixam o
idioma e o fuso, sem os quais um resultado mudaria com a máquina que rodou, e a
suíte se recusa a iniciar se eles faltarem.

Os testes ficam num `__tests__/` ao lado do código que cobrem, nomeados pelo
módulo em kebab-case mais o tipo, mais a plataforma quando o módulo coberto
bifurca:

```
src/lib/domain/__tests__/streaks.unit.test.ts
src/components/heat-graph/__tests__/heat-graph.unit.test.tsx
src/features/today/__tests__/today-screen.unit.test.android.tsx
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

**As telas React Native do Android são claras.** Hábitos e formulário montam o
`StyleSheet` a partir da paleta resolvida no escopo do módulo, que é a clara.
O Android troca de aparência com o processo vivo, então seguir a troca ali
significa tirar as superfícies do `StyleSheet`. As duas telas Compose e o iOS
inteiro acompanham normalmente.

**O widget do Android é um bitmap.** A biblioteca rasteriza as views, então ele
não segue a escala de fonte do sistema, as duas aparências são desenhadas a
cada atualização, e o recorte que o launcher faz não é controlável.

**`src/hooks/` não existe.** A pasta não é criada vazia. Ela aparece com o
primeiro hook promovido para lá, e a regra de promoção está em
[docs/arquitetura.md](docs/arquitetura.md#a-regra-de-promoção).

**O widget do iOS não compartilha código com o app.** O plugin de widgets do
`babel-preset-expo` transforma o corpo da função numa string avaliada em outro
bundle, sem grafo de módulos, então ele não consegue importar o que renderiza.
A cor de destaque dele é uma cópia manual pelo mesmo motivo. O do Android tem
grafo e lê a regra de cor de `lib/domain/heat.ts`, mas desenha com as
primitivas da própria biblioteca, então o mapa de calor é redesenhado ali.

**Três textos ficam em inglês em qualquer idioma:** o nome do canal de
notificação, o corpo do lembrete e o botão "Check in". Eles nascem em
`lib/native/`, que recebe texto por parâmetro e não importa o i18n.

**Layout nativo não é coberto por nenhum gate.** O runner não renderiza
`@expo/ui`, nem SwiftUI nem Compose, então uma tela pode compilar, passar na
suíte e desenhar errado.

**O app pede `INTERNET` sem usar rede.** A permissão vem da base do template do
Expo junto com outras quatro, não de uma declaração deste projeto. Vale saber
antes de escrever a página da Play Store.

**Nomes de hábito de exemplo congelam no idioma em que foram criados.** Eles
são linhas no SQLite, e trocar o idioma depois não os traduz.

**Espaçamento e raio ainda têm números soltos nos estilos.** `theme/spacing.ts`
declara cinco métricas de layout, não uma escala. É o único ponto em que o
código não cumpre a regra que ele mesmo estabelece.

**`patches/expo-modules-jsi@57.0.4.patch`** contorna um erro de compilação do
Swift 6.2 nesse pacote, onde `abs(_:)` fica ambíguo dentro de um `guard`,
trocando a chamada pelo `.magnitude` equivalente. Remova quando o upstream
corrigir.
