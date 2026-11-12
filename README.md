# João Panucci — JoãoOS

Portfólio interativo em forma de sistema operacional neural (estilo macOS): wallpaper de cérebro-circuito feito de 0 e 1,
dock com magnificação, janelas arrastáveis, Spotlight (`⌘K`/`Ctrl+K`), um **Xadrez** para desafiar o João e o
**Nyron Lab** (mini game engine + Java).

## Aplicativos

| App | O que mostra |
| --- | --- |
| Sobre mim | Perfil, experiência e tecnologias |
| Projetos | Nyron Engine, AutoDock, Dakiali, JELCH Group, SAPS |
| Xadrez | João-Bot em 4 níveis (motor próprio), pontuação, ranking e partidas online por código de convite (Supabase — veja [`docs/supabase.md`](docs/supabase.md)) |
| Nyron Lab | Simulação orbital (lançamento por arraste), código Java ilustrativo e execução na JVM |
| Terminal | Comandos respondidos pelo serviço Java (ou modo demo, sem o serviço) |
| Contato | E-mail, GitHub, LinkedIn, Discord |
| Configurações | Idioma (PT/EN/ES), cor de destaque, redução de movimento |

Código do front-end em `src/os/`; textos em `src/os/i18n.ts`; xadrez em `src/os/chess/` e `src/os/apps/Chess.tsx`; arte do wallpaper em `src/os/neuralArt.ts`.

## Créditos

Ícones dos apps: tema **Yaru** (Ubuntu), licença CC BY-SA 4.0 — veja `public/icons/yaru/README.md`.
Ícones de interface: Lucide.

## Rodando

```sh
npm install
npm run dev
```

Para o terminal/Nyron Lab usarem uma JVM de verdade:

```sh
cd services/joaoos-api
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

O xadrez online/ranking é opcional: sem Supabase configurado o jogo contra o João-Bot funciona normalmente.

Sem o serviço Java, o JoãoOS entra em **modo demo** (respostas simuladas no navegador, sinalizadas na interface).
Em produção, defina `NEXT_PUBLIC_JOAOOS_API_URL` apontando para a API hospedada; sem ela nenhuma requisição ao serviço é feita.
Detalhes do serviço em [`services/joaoos-api/README.md`](services/joaoos-api/README.md).

## Deploy

Cloudflare Workers via OpenNext: `npm run preview` / `npm run deploy`. O serviço Java precisa de hospedagem própria.
