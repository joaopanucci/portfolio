# JoãoOS — Relatório da Etapa 005

Data: 12/11/2026. Branch: `feature/joaoos-desktop`.

## 1. Resumo

O JoãoOS foi evoluído na rota `/joaoos`, preservando as rotas e os dados do portfólio tradicional. Foram separados gerenciamento de janelas, aplicativos, traduções, preferências, catálogo e terminal. Foi criado um serviço Java 21 independente, integrado por REST ao terminal. Nenhum commit, push, merge ou deploy foi executado. Dependências do frontend e lockfile não foram alterados.

## 2. Auditoria inicial

- Branch confirmada antes de qualquer escrita. A exclusão de `CLAUDE.md`, os scripts 003/004, wallpapers e arquivos do JoãoOS já estavam presentes como alterações locais e foram preservados.
- Inspecionados `AGENTS.md`, layout, CSS global, projetos, tipos, tecnologias, experiência, configurações de TypeScript/ESLint, scripts npm e implementação anterior de bloqueio e desktop. `CLAUDE.md` já estava ausente; sua versão em HEAD apenas aponta para `AGENTS.md`.
- Lidas as documentações locais Next.js de `use client`, ambiente e `Image`, em `node_modules/next/dist/docs/`.
- ESLint inicial: dois erros em código arquivado dentro de `.local-backups` (estado em efeito e navegação interna com `<a>`). A pasta foi excluída das ferramentas, sem desabilitar regras no código ativo.
- TypeScript inicial e build Next.js inicial passaram. `npm ls --depth=0` passou; `npm audit` identificou 22 vulnerabilidades.
- PNG original confirmado (~1,8 MB), GIF confirmado (~914 KB). Ambos preservados. Não foi necessária conversão para vídeo; desempenho em dispositivos físicos modestos ainda não foi medido.
- OpenJDK 21.0.12.1 e Maven disponíveis. Spring Boot 3.5.16 fixado no novo serviço; referência oficial consultada: https://spring.io/blog/2026/06/25/spring-boot-3-5-16-available-now/.

## 3. Arquivos modificados

- `src/app/joaoos/page.tsx`: preferências compartilhadas, idioma consistente, wallpaper persistente e redução de movimento.
- `src/app/joaoos/Desktop.tsx`: barra, dock e composição de aplicativos/janelas.
- `.gitignore`: backups locais e artefatos Maven ignorados.
- `eslint.config.mjs`: exclusão de backups e artefatos compilados.
- `tsconfig.json`: exclusão de backups e serviço independente da análise TypeScript.

Os dois arquivos existentes do JoãoOS já eram não rastreados no início. Não foram alterados dados, componentes ou páginas do portfólio tradicional.

## 4. Arquivos criados

Frontend, em `src/app/joaoos/`:

- `Applications.tsx`: composição dos oito aplicativos.
- `Window.tsx`: janela reutilizável e restrição de coordenadas/dimensões.
- `TerminalApp.tsx`: formulário, histórico, carregamento, timeout, cancelamento e indisponibilidade.
- `preferences.ts`: armazenamento validado e sincronizado, migração de idioma antigo e fallback em memória.
- `i18n.ts`: textos PT-BR, EN e ES e locales.
- `catalog.ts`: catálogo público, ações, tecnologias conhecidas e estrutura de galeria.
- `github.ts`: adaptador opcional tipado para repositórios públicos, sem tokens e sem consulta automática.
- `joaoos.css`: estilos restritos ao JoãoOS, desktop e mobile.

Backend, em `services/joaoos-api/`:

- `pom.xml` e `README.md`.
- `src/main/java/com/joaoos/api/JoaoosApplication.java`.
- `TerminalController.java`, `TerminalService.java`, `TerminalResponse.java`, `ApiErrors.java`, `DevelopmentCors.java` e `RequestLimitFilter.java`, no mesmo pacote.
- `src/main/resources/application.properties`.
- `src/test/java/com/joaoos/api/TerminalServiceTest.java`, `TerminalHttpTest.java` e `ProductionCorsTest.java`.

Relatório: `joaoos-etapa-005-relatorio.md`.

## 5. Backups e evidências

Diretório ignorado: `.local-backups/etapa-005/`.

Antes das alterações foram copiados `src/app/joaoos/`, `.gitignore`, `eslint.config.mjs` e `tsconfig.json`. Os nomes das cópias são `joaoos/`, `gitignore`, `eslint.config.mjs` e `tsconfig.json`. Backups anteriores permaneceram intactos.

O diretório também contém logs de auditoria, lint, TypeScript, builds, Maven, árvore de dependências Java, endpoints, teste de navegador e capturas `desktop.png`/`mobile.png`. Playwright e Prettier foram instalados somente em `tooling/` dentro desse diretório ignorado, sem modificar dependências do projeto. O roteiro de navegador está em `browser.cjs`.

## 6. Funcionalidades implementadas e verificadas

- Bloqueio e entrada no desktop; idioma compartilhado PT-BR, EN e ES.
- PNG cobrindo viewport; seleção de GIF, fallback PNG se houver erro; preferência persistente. O wallpaper permanece montado na transição de bloqueio para desktop.
- Preferência de redução de movimento e respeito ao sistema. Quando reduzido, o GIF é desmontado e as transições são desabilitadas. Nenhuma solicitação repetida é gerada pelo relógio.
- Destaque ciano/violeta com efeito em ícones, foco e controles.
- Oito aplicativos: Projetos, Sobre, Tecnologias, Experiência, Terminal, Contato, Dev Center e Configurações.
- Múltiplas janelas de aplicativos diferentes, uma instância por aplicativo. Foco por ponteiro/teclado, ordem de sobreposição, arraste com captura de ponteiro, redimensionamento por ponteiro ou setas, minimizar, maximizar, restaurar e fechar.
- Janelas minimizadas continuam montadas; dock indica aplicativos abertos e restaura suas janelas. Coordenadas e dimensões são limitadas à viewport; mobile usa área útil disponível.
- Catálogo preserva SAPS e Acho; adiciona Dakiali, JELCH Group, AutoDock e Nyron Engine. Dakiali somente com site público; JELCH com descrição institucional; AutoDock com GitHub e Discord solicitados. Nyron sem screenshots inventados; SAPS sem links internos.
- Dev Center com links públicos. O adaptador GitHub está preparado; a interface ainda não lista dados remotos.
- Terminal envia comandos à JVM real. Lista explícita: `help`, `about`, `projects`, `skills`, `clear`, `java --version`, `whoami`; `clear` é local no frontend. Nenhum processo, shell, acesso ao filesystem ou avaliação de código é usado.
- Validação de 120 caracteres, rejeição de caracteres de controle, limite de corpo JSON de 2048 bytes, tratamento estruturado de erros, CORS exato apenas em perfil `dev`, bind padrão em loopback e ausência de tokens.
- Terminal mantém até 100 entradas, timeout de 8 segundos, cancelamento ao desmontar e aviso de serviço indisponível. Demais aplicativos funcionam independentemente do backend.
- Preferências continuam utilizáveis em memória quando `localStorage` é bloqueado. Persistência entre recargas exige armazenamento disponível.

## 7. Resultado dos testes

| Verificação | Resultado |
| --- | --- |
| `npm run lint` final | Passou, sem erros ou avisos |
| `npx tsc --noEmit` final | Passou |
| `npm run build` final | Passou; rotas tradicionais e `/joaoos` geradas |
| `npm ls --depth=0` | Passou |
| `mvn -f services/joaoos-api/pom.xml verify` | Passou, 21 testes, zero falhas/erros |
| `mvn ... dependency:tree` | Passou |
| Inicialização real do JAR | Passou em Java 21, porta 8080 |
| POST real dos sete comandos | HTTP 200, JSON estruturado |
| Testes HTTP Spring | Validação, JSON malformado, idioma inválido, caracteres de controle, entrada longa, comando recusado, corpo excessivo e CORS |
| CORS sem perfil dev | Acesso cross-origin recusado |
| Chrome headless, build de produção | Fluxos abaixo aprovados |
| `git diff --check` | Passou |

Navegador: tela de bloqueio, escolha de idioma, entrada, oito aplicativos, links exatos do catálogo, arraste, redimensionamento por ponteiro e teclado, maximizar/restaurar, minimizar/restaurar pelo dock, fechar/reabrir, resposta Java 21 real, comando recusado, `clear`, falha de rede simulada, preferências após recarga, GIF, redução de movimento por opção e sistema, idioma espanhol após bloqueio, viewport 390×844 e página inicial tradicional. Testado também idioma com armazenamento bloqueado. Sem erros JavaScript ou mensagens inesperadas de erro no console. Erros HTTP/rede esperados dos cenários negativos são excluídos dessa contagem.

Capturas desktop (1440×900) e mobile (390×844) inspecionadas visualmente. Não foi feita validação em aparelho físico, leitor de tela ou outros motores de navegador.

## 8. Problemas e limitações

- A porta 3000 já estava ocupada por outro serviço. Para testes, o Next.js rodou em 3105 e o backend recebeu essa origem exata via configuração do perfil dev. O serviço original não foi interrompido.
- Backups estavam sendo analisados pelo ESLint; exclusões resolvem a interferência sem esconder erros da aplicação ativa.
- Associação acessível dos selects foi explicitada durante validação.
- Não foi alterada a exclusão preexistente de `CLAUDE.md`.
- Não houve teste completo de build OpenNext/Workers ou deploy; o build Next.js passou e a configuração Cloudflare foi preservada. Java exige hospedagem independente.

## 9. Vulnerabilidades

`npm audit`: **22 ocorrências nas dependências existentes: 2 críticas, 8 altas e 12 moderadas**. Relatório integral local: `.local-backups/etapa-005/audit.json`.

| Pacote | Severidade | Relação |
| --- | --- | --- |
| `@node-minify/core` | moderate | Transitiva |
| `@opennextjs/aws` | moderate | Transitiva |
| `@opennextjs/cloudflare` | moderate | Direta |
| `@typescript-eslint/eslint-plugin` | moderate | Transitiva |
| `@typescript-eslint/parser` | moderate | Transitiva |
| `@typescript-eslint/type-utils` | moderate | Transitiva |
| `@typescript-eslint/typescript-estree` | moderate | Transitiva |
| `@typescript-eslint/utils` | moderate | Transitiva |
| `body-parser` | high | Transitiva |
| `brace-expansion` | high | Transitiva |
| `glob` | moderate | Transitiva |
| `miniflare` | high | Transitiva |
| `minimatch` | moderate | Transitiva |
| `next` | critical | Direta |
| `proxy-addr` | critical | Transitiva |
| `qs` | moderate | Transitiva |
| `sharp` | high | Transitiva |
| `source-map-js` | high | Transitiva |
| `typescript-eslint` | moderate | Transitiva |
| `undici` | high | Transitiva |
| `wrangler` | high | Direta |
| `zod` | high | Transitiva |

Críticas: `next` e `proxy-addr`. O audit indica Next.js 16.4.6 como correção disponível para a versão instalada; uma atualização deve ser avaliada com a compatibilidade OpenNext/Cloudflare. Há recomendações automáticas de alteração maior/downgrade em outras cadeias, portanto nenhuma correção automática foi aplicada. O número de pacotes afetados não equivale a comprovação de exploração neste aplicativo. Não foi executado `npm audit fix --force`.

Maven resolve dependências e passa nos testes; **não foi executado scanner de CVEs para as dependências Java**. Não se declara ausência de vulnerabilidades no backend.

## 10. Execução local

Frontend, na raiz:

```sh
npm run dev
```

Backend, em outro terminal:

```sh
cd services/joaoos-api
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Abra `http://localhost:3000/joaoos`. O endereço padrão da API é `http://localhost:8080`. Caso necessário, configure `NEXT_PUBLIC_JOAOOS_API_URL` em `.env.local` e reinicie/recompile o frontend. Nunca colocar credenciais nessa variável pública.

Se a porta 3000 estiver ocupada:

```sh
npm run dev -- --port 3105
```

```sh
cd services/joaoos-api
mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.arguments="--joaoos.cors.origins=http://localhost:3105"
```

Para testar/empacotar o backend: `mvn verify` dentro de `services/joaoos-api`. Consulte também seu `README.md` para o contrato REST e execução do JAR.

## 11. Pendências explícitas

- Imagens reais de Nyron Engine: aguardam os arquivos do usuário; estrutura pronta, galeria vazia.
- Consumo da API pública GitHub no Dev Center: adaptador preparado, integração visual futura; não validado contra serviço remoto.
- Hospedagem Java de produção, HTTPS e proxy de mesma origem: documentados, não executados. Cloudflare Workers não executa o JAR. Não usar perfil `dev` em produção.
- Correções de vulnerabilidades preexistentes e análise de CVEs Java.
- Avaliação em dispositivos físicos, outros navegadores e build específico OpenNext.

A implementação e a integração local foram validadas nos limites acima; não se declara validação de produção ou das integrações futuras.
