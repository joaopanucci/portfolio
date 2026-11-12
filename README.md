# João Panucci — JoãoOS

Portfólio interativo em forma de sistema operacional cósmico (estilo macOS): wallpaper vivo, dock com magnificação,
janelas arrastáveis, Spotlight (`⌘K`/`Ctrl+K`), linha do tempo do universo e o **Nyron Lab** (mini game engine + Java).

## Aplicativos

| App | O que mostra |
| --- | --- |
| Sobre mim | Perfil, experiência e tecnologias |
| Projetos | Nyron Engine, AutoDock, Dakiali, JELCH Group, SAPS, Acho |
| Linha do Tempo | Do Big Bang ao código, com calendário cósmico |
| Nyron Lab | Simulação orbital (lançamento por arraste), código Java ilustrativo e execução na JVM |
| Terminal | Comandos respondidos pelo serviço Java (ou modo demo, sem o serviço) |
| Contato | E-mail, GitHub, LinkedIn, Discord |
| Configurações | Idioma (PT/EN/ES), wallpaper, cor de destaque, redução de movimento |

Código do front-end em `src/os/`; textos em `src/os/i18n.ts` e `src/os/timeline.ts`.

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

Sem o serviço Java, o JoãoOS entra em **modo demo** (respostas simuladas no navegador, sinalizadas na interface).
Em produção, defina `NEXT_PUBLIC_JOAOOS_API_URL` apontando para a API hospedada; sem ela nenhuma requisição ao serviço é feita.
Detalhes do serviço em [`services/joaoos-api/README.md`](services/joaoos-api/README.md).

## Deploy

Cloudflare Workers via OpenNext: `npm run preview` / `npm run deploy`. O serviço Java precisa de hospedagem própria.
