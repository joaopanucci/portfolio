# Xadrez online e ranking com Supabase

O xadrez funciona sem nada configurado (contra o João-Bot, com pontos guardados no navegador).
Com o Supabase ele ganha **ranking**, **apelido**, **pontuação validada no servidor** e **partidas online por código de convite**.

## 1. Criar e configurar o projeto

1. Crie um projeto em <https://supabase.com> (plano gratuito serve).
2. **Authentication → Sign In / Providers → "Allow anonymous sign-ins"**: ative. Cada visitante recebe uma conta anônima
   automaticamente (sem e-mail ou senha) para ter identidade nas partidas.
3. **SQL Editor → New query**: cole o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql) e clique em **Run**.
   Isso cria as tabelas `chess_players`, `chess_bot_games` e `chess_games`, as regras de segurança (RLS) e liga o Realtime.

## 2. Variáveis de ambiente

Em **Project Settings → API** copie a *Project URL*, a chave `anon` e a chave `service_role`.

| Variável | Onde | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | local + Cloudflare **Build variables** | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local + Cloudflare **Build variables** | pública (protegida pelas regras RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | local + Cloudflare **Secrets** (runtime) | **secreta** — nunca com prefixo `NEXT_PUBLIC_` |

- **Local:** copie `.env.example` para `.env.local` e preencha. Reinicie `npm run dev`.
- **Cloudflare:** *Workers & Pages → portfolio → Settings → Variables and Secrets* (runtime) e *Build → Variables* (as duas `NEXT_PUBLIC_*`,
  porque elas são embutidas no JavaScript durante a build). Faça um novo deploy depois.

## 3. Como funciona

```
navegador ──(login anônimo)──▶ Supabase Auth
    │
    ├─ lê ranking e a própria partida ──▶ Supabase (RLS + Realtime)
    └─ escreve (jogada, resultado) ─────▶ POST /api/chess ──▶ valida com as regras do xadrez ──▶ Supabase (service role)
```

- **Nenhuma escrita vem direto do navegador.** As tabelas só aceitam `select` pelas regras RLS; toda jogada passa por `/api/chess`,
  que confere o token do jogador, de quem é a vez e se a jogada é legal (chess.js) antes de gravar.
- **Tempo real:** a partida online é a linha de `chess_games`; cada jogada atualiza a linha e chega ao adversário via Realtime
  (com uma verificação a cada 4 s caso o socket caia).
- **Convite:** o código tem 6 caracteres (sem letras ambíguas). O link `https://seu-site/?xadrez=CODIGO` abre o jogo e entra na partida.
- **Controle de concorrência:** cada atualização usa o `updated_at` lido, então duas jogadas simultâneas nunca se sobrescrevem.

## 4. Pontuação

**Contra o João-Bot** (o servidor reexecuta todos os lances para confirmar que são legais e que a partida terminou):

| Nível | Vitória | Empate |
| --- | --- | --- |
| Fácil | 10 | 3 |
| Médio | 25 | 7 |
| Difícil | 60 | 18 |
| Mestre | 120 | 36 |

Vitórias rápidas valem até +50% (mate em poucos lances). Derrotas e desistências não pontuam; partidas em que se usou "desfazer"
não pontuam; vitórias com menos de 4 lances de cada lado são recusadas; há um intervalo mínimo de 8 s entre partidas.

**Online:** vitória 50 (+ até 40 se o adversário tinha rating maior), empate 20, derrota 0. O **rating** (Elo, começa em 1000, K = 32) só muda em partidas online.

### Limite honesto

O João-Bot roda no navegador. Quem escrever um cliente próprio pode simular partidas fáceis e enviar lances legais; o servidor garante
que os lances são válidos, mas não consegue provar que foi o motor quem jogou. Trate o ranking contra o bot como diversão.
As partidas online são autoritativas no servidor (cada jogada é validada lá).

## 5. Testes

A regra de negócio fica em `src/os/chess/service.ts` e é independente do banco (recebe um `Store`). O motor tem verificação *perft*
contra posições conhecidas. Para rodar localmente basta `node` 24 (veja os scripts descritos no PR).
