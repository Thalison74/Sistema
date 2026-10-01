# Gerenciador de Lucros

Aplicativo desktop para Windows que registra sessões de apostas/operações com várias contas, calculando automaticamente o lucro ou prejuízo de cada conta, o resultado da sessão e o resultado geral acumulado.

Não existe login, cadastro ou servidor. Cada instalação guarda seus próprios dados localmente, em um banco SQLite no computador do usuário, e funciona 100% offline.

## Tecnologias

- [Tauri 2](https://tauri.app/) (shell nativo em Rust + WebView do sistema)
- React 19 + TypeScript
- Tailwind CSS v4
- SQLite via [`rusqlite`](https://docs.rs/rusqlite) (bundled, sem dependência externa)
- Recharts (gráfico de evolução do resultado)

## Estrutura do projeto

```
src/                      Frontend (React/TS)
  components/              Componentes de UI e layout
  hooks/                   Contextos (tema, toast, confirmação)
  lib/                     money.ts, date.ts, tauri.ts (wrapper de invoke), backupActions.ts
  pages/                   Dashboard, Sessions, SessionDetail, History, Settings
  types/                   Tipos espelhando as structs do Rust

src-tauri/                 Backend (Rust)
  src/
    commands/              Comandos expostos ao frontend (sessions, accounts, dashboard, settings, backup, system)
    calculations.rs        Toda a matemática financeira centralizada aqui (resultadoConta, resultadoSessao, estatísticas)
    db.rs                  Conexão SQLite + migrations
    repo.rs                Mapeamento de linhas do banco para structs
    models.rs               Structs compartilhadas com o frontend (via serde)
    state.rs                Estado da aplicação (conexão do banco, caminhos)
    error.rs                 Erros amigáveis exibidos ao usuário + log local
  tauri.conf.json           Configuração do app (ícone, janela, bundle do instalador)

download-page/              Página estática de distribuição (ver seção própria)
```

## Cálculos

Todo valor monetário é armazenado como **centavos inteiros** (`i64`), nunca `float`, para evitar imprecisão de ponto flutuante. A formatação para Real (R$) acontece apenas na camada de exibição.

- `resultadoConta = saldoFinal - saldoInicial` (ou "Pendente" enquanto o saldo final não for informado)
- `resultadoSessao = soma dos resultados das contas já finalizadas`
- `resultadoGeral = soma dos resultados das sessões`

## Onde os dados ficam armazenados

O banco fica na pasta de dados do aplicativo do Windows (gerenciada pelo Tauri via `app_data_dir`), tipicamente:

```
C:\Users\<usuário>\AppData\Roaming\com.gerenciadordelucros.app\gerenciador_lucros.db
```

Logs de erro ficam em `...\com.gerenciadordelucros.app\logs\app.log`. Esses caminhos podem ser abertos diretamente pela tela **Configurações → Abrir Pasta dos Dados**.

Cada computador tem seu próprio banco, totalmente independente dos demais — não existe sincronização nem conta central.

## Desenvolvimento local

Pré-requisitos: [Node.js](https://nodejs.org/) e [Rust](https://www.rust-lang.org/tools/install) (via `rustup`), além das [ferramentas de build do Windows](https://tauri.app/start/prerequisites/) (Visual Studio Build Tools com "Desktop development with C++").

```sh
npm install
npm run tauri dev
```

Isso sobe o Vite em modo desenvolvimento e compila/executa o app Rust com hot-reload do frontend.

## Gerando o build de produção

```sh
npm run tauri build
```

O instalador final (NSIS) é gerado em:

```
src-tauri/target/release/bundle/nsis/Gerenciador de Lucros_<versão>_x64-setup.exe
```

Esse é o único arquivo que precisa ser distribuído — ele instala o app e cria os atalhos, sem exigir que a pessoa tenha Node, Rust ou qualquer outra ferramenta instalada.

## Como alterar a versão

A versão é definida em dois lugares que devem ficar sincronizados:

1. `src-tauri/tauri.conf.json` → campo `"version"`
2. `src-tauri/Cargo.toml` → campo `version` do pacote

Siga [versionamento semântico](https://semver.org/lang/pt-BR/) (`1.0.0`, `1.0.1`, `1.1.0`, `2.0.0`...).

## Como criar uma nova release

1. Atualize a versão (passo acima) e as novidades da versão em `download-page/index.html` (seção "Novidades da versão").
2. Rode `npm run tauri build`.
3. Pegue o instalador gerado em `src-tauri/target/release/bundle/nsis/`.
4. Renomeie/hospede o instalador com um nome que inclua a versão, por exemplo `Gerenciador-de-Lucros-Setup-1.0.1.exe` — nunca reutilize o nome de uma versão anterior, para permitir rollback.
5. Publique o arquivo em algum storage público (ver seção abaixo) e atualize o link, a versão, a data e o tamanho na página de download.

## Atualizando o link da página de download

A página em `download-page/index.html` tem um bloco `<script>` no topo com as constantes de release (versão, data, tamanho, URL do instalador). Edite apenas esse bloco — o restante da página lê esses valores automaticamente. Publique a pasta `download-page/` em qualquer host estático (Vercel, Netlify, GitHub Pages etc.) e hospede o `.exe` em um local com link direto (ex.: GitHub Releases, S3, Backblaze B2).

## Ícone

O projeto usa os ícones placeholder gerados pelo `create-tauri-app` em `src-tauri/icons/`. Para usar uma logo definitiva, gere o conjunto de ícones com:

```sh
npm run tauri icon caminho/para/logo.png
```

Isso substitui automaticamente todos os tamanhos usados pelo executável, instalador, barra de tarefas e atalhos.
