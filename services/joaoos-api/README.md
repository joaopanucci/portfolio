# JoãoOS API

Serviço independente em Java 21, Spring Boot 3.5.16 e Maven. Não participa do build Next.js/OpenNext.

## Desenvolvimento

Na raiz do repositório:

```sh
npm run dev
```

Em outro terminal:

```sh
cd services/joaoos-api
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Abra http://localhost:3000/joaoos. O frontend usa `http://localhost:8080` por padrão. Para outro endereço público da API, configure `NEXT_PUBLIC_JOAOOS_API_URL` em `.env.local` e reinicie/recompile Next.js. Essa variável é pública e não deve conter credenciais.

CORS só existe no perfil `dev`, com origens exatas `http://localhost:3000` e `http://127.0.0.1:3000`, sem cookies. Para outra porta local:

```sh
mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.arguments="--joaoos.cors.origins=http://localhost:3105"
```

## Contrato

```sh
curl http://localhost:8080/api/terminal \
  -H 'Content-Type: application/json' \
  -d '{"command":"java --version","language":"pt"}'
```

Resposta: `{"command":"java --version","status":"ok","lines":["Java 21","..."]}`. Idiomas: `pt`, `en`, `es`; idioma omitido usa português. Comandos permitidos: `help`, `about`, `projects`, `skills`, `nyron`, `clear`, `java --version`, `whoami`. `nyron` executa de verdade, na JVM, uma órbita com integração velocity-Verlet (3650 passos fixos) e devolve raio, deriva e tempo de execução. A comparação é exata após remover espaços nas extremidades. `clear` é atendido localmente no frontend.

HTTP 200: comando conhecido; 400: entrada inválida ou comando desconhecido; 413: corpo acima de 2048 bytes; 415: formato não suportado; 405: método não suportado. Erros retornam `lines` e não incluem stack traces. Máximo de 120 caracteres sem caracteres de controle. Não há execução de processos, leitura de arquivos ou interpretação de código. A versão Java vem da própria JVM.

```sh
mvn verify
java -jar target/joaoos-api-0.1.0.jar --spring.profiles.active=dev
```

## Hospedagem

A API requer um processo JVM 21 separado; Cloudflare Workers/OpenNext continua hospedando o frontend e não executa este JAR. O bind padrão é `127.0.0.1:8080`. Uma integração de produção precisará de infraestrutura Java, HTTPS e proxy de mesma origem para `/api/terminal`, além de configurar a URL pública no build do frontend. Não habilitar o perfil `dev` em produção. Nenhum deploy foi realizado. Com a API desligada, o terminal apresenta indisponibilidade e os demais aplicativos continuam operando.

O catálogo do desktop está em `src/app/joaoos/catalog.ts`. `images` aceita caminhos públicos e textos alternativos; Nyron começa com a galeria vazia. `publicLinks` é a base para uma futura integração pública com GitHub, que ainda não faz chamadas à API do GitHub nem usa tokens.
