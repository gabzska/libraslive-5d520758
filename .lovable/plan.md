
# Atualização LibrasLive — Plano detalhado

Foco desta iteração (escolhido por você): **(1) Biblioteca de sinais + banco**, **(2) Português → Libras (texto/voz → avatar VLibras)**, **(3) Modo Educação**, **(4) Modo Hospital**. Os outros 11 módulos (videoconferência, API pública, voz↔Libras bidirecional avançado, IA contextual de aprendizado contínuo, app mobile, etc.) ficam no **roadmap** ao final.

Mantém tudo que já funciona hoje: reconhecimento por câmera (`/conversa`), AlphabetBanner, reconstrução por IA, VLibras widget global.

---

## 1. Lovable Cloud — ativação e modelagem

Habilitar Lovable Cloud (Supabase gerenciado) e criar o schema abaixo via migration. Todas as tabelas no schema `public`, com GRANTs e RLS.

### Tabelas

- **`categorias`** — `id uuid pk`, `slug text unique`, `nome text`, `descricao text`, `icone text`, `ordem int`. Leitura pública.
- **`sinais`** — `id uuid pk`, `palavra text not null`, `slug text unique`, `categoria_id uuid fk`, `descricao text`, `video_url text`, `animacao_url text`, `sinonimos text[]`, `relacionados text[]`, `confianca numeric default 1`, `origem text` (`manual|vlibras|importado`), `aprovado bool default true`, `criado_por uuid null`, `created_at`, `updated_at`. Índices em `slug`, `palavra` (trigram), `categoria_id`. Leitura pública dos aprovados.
- **`historico_traducao`** — `id uuid pk`, `user_id uuid null`, `direcao text` (`pt_libras|libras_pt`), `entrada text`, `saida text`, `confianca numeric`, `contexto jsonb`, `created_at`. RLS: usuário lê só o próprio; anon insere com `user_id = null`.
- **`feedbacks`** — `id uuid pk`, `sinal_id uuid fk null`, `traducao_id uuid fk null`, `user_id uuid null`, `tipo text` (`correcao|sugestao|erro`), `mensagem text`, `payload jsonb`, `status text default 'pendente'`, `created_at`. Insert público; leitura só staff (placeholder por enquanto: apenas service role).
- **`contribuicoes_sinais`** — `id uuid pk`, `user_id uuid null`, `palavra text`, `descricao text`, `video_url text`, `categoria_sugerida text`, `status text default 'pendente'`, `revisor_id uuid null`, `created_at`. Mesma política de feedbacks.
- **`progresso_educacao`** — `id uuid pk`, `user_id uuid not null`, `modulo text` (`alfabeto|quiz|sinais`), `acertos int`, `erros int`, `tempo_seg int`, `payload jsonb`, `created_at`. RLS: dono lê/escreve.
- **`frases_hospital`** — `id uuid pk`, `categoria text` (`emergencia|sintoma|admissao|exame|alta`), `prioridade int`, `texto_pt text`, `gloss text`, `icone text`, `ordem int`. Leitura pública; seed inicial via migration.

### Seed inicial (migration)
- ~12 categorias (saudações, pronomes, família, alimentação, saúde, educação, tempo, números, alfabeto, emergência, hospital, sentimentos).
- ~150 sinais comuns (palavra + gloss + categoria; vídeo/animação ficam `null` agora, preenchidos via VLibras player no front).
- ~60 frases hospitalares organizadas por categoria + prioridade.

### Auth
- Apenas **email/senha** opcional para gravar progresso/contribuições. Sem login obrigatório — toda a app continua usável anonimamente. (Sem Google OAuth nesta iteração; pode ser adicionado depois.)
- Sem tabela `profiles` por enquanto (você não pediu campos extras de perfil).

---

## 2. Português → Libras (texto/voz → avatar VLibras)

Nova rota **`/traduzir`** (PT→Libras) separada da `/conversa` (Libras→PT) existente.

Componentes:
- **`TextToSignPanel`** — textarea + botão "Traduzir", botão de microfone (reusa `useSpeechRecognition`), histórico recente, sugestão de frases comuns.
- **`VLibrasPlayer`** — wrapper que injeta o widget VLibras em modo embed (fixo no painel, não flutuante) e dispara `window.vlibrasPlugin.translate(text)` sempre que o texto muda (debounce 400ms).
- **Soletração fallback** — quando uma palavra não está em `sinais` (lookup por slug normalizado), exibimos um carrossel do alfabeto manual letra por letra (reusa `HandGlyph` do `AlphabetBanner`).
- **Server fn `lookupSigns`** — recebe a frase, tokeniza, busca em `sinais` (match por palavra/slug/sinônimos) e retorna `{ tokens: [{ palavra, sinal_id|null, soletrar?: true }] }`. Usado para destacar quais palavras têm sinal próprio e quais serão soletradas.
- **Auto-fala opcional** desligada por padrão (PT→Libras não precisa TTS).

Gravação no `historico_traducao` com `direcao='pt_libras'` (anônimo ou autenticado).

---

## 3. Modo Educação — `/aprender`

Nova rota com 3 abas (Tabs shadcn):

1. **Alfabeto** — grid A–Z reusando `AlphabetBanner` em `mode="learn"` com flashcards e dica de configuração. Botão "Praticar com câmera" abre overlay usando `useHolisticRecognition` + `recognizeLetter` para validar a letra do flashcard atual (sem sair da página).
2. **Quiz** — 10 perguntas randômicas por sessão, dois formatos:
   - "Qual letra é este sinal?" (mostra `HandGlyph`, 4 opções).
   - "Sinalize esta letra" (mostra letra, valida via câmera com `recognizeLetter`, 5s timeout).
   Pontuação salva em `progresso_educacao` (`modulo='quiz'`).
3. **Sinais comuns** — lista paginada de `sinais` por categoria; clicar abre modal com VLibras player executando o sinal + descrição/sinônimos. Permite marcar "aprendido" (vira `progresso_educacao` com `modulo='sinais'`).

Estatísticas no topo: total de acertos, sequência, sinais aprendidos, nível (calculado: 1 nível a cada 20 acertos).

---

## 4. Modo Hospital — `/hospital`

Interface densa, alto contraste, foco em toque rápido (otimizada para tablet/celular do atendimento).

Estrutura:
- **Header de emergência** — botão grande vermelho "EMERGÊNCIA" que dispara frase + áudio TTS + tradução VLibras imediata.
- **Categorias** (chips fixos): Emergência, Sintomas, Admissão, Exame, Alta.
- **Grid de frases** filtrado por categoria — cada card mostra ícone + texto PT; toque ➜ envia para VLibras player (lado direito em desktop, modal fullscreen em mobile) e simultaneamente lê em voz alta via `tts.ts`.
- **Modo bidirecional** — botão "Ouvir paciente" abre o `useSpeechRecognition` para capturar fala do paciente surdo (caso use voz) ou abre `/conversa` em nova aba para sinais. (A captura bidirecional avançada via câmera no mesmo painel fica no roadmap.)
- **Frases personalizadas** — campo livre que cai no mesmo fluxo PT→Libras.

Dados vêm de `frases_hospital` (seed inicial; admin pode adicionar via SQL por enquanto).

---

## 5. Mudanças na UI global

- **Header/nav** novo no `__root.tsx`: Home · Conversa · Traduzir · Aprender · Hospital · (Login opcional). Mantém o design lilás/branco atual.
- **Dark mode** — adicionar toggle no header usando `prefers-color-scheme` + classe `.dark` (tokens já existem no `styles.css`; só preciso revisar contraste).
- **Acessibilidade** — `aria-label` em todos os botões de ícone, foco visível, alvos ≥ 44px, `h-dvh` no lugar de `h-screen`.

---

## 6. Arquitetura técnica

```text
src/
  routes/
    __root.tsx           (header com nav + dark mode)
    index.tsx            (landing — adiciona cards das novas seções)
    conversa.tsx         (existente, sem mudanças destrutivas)
    traduzir.tsx         (novo — PT→Libras)
    aprender.tsx         (novo — educação, 3 tabs)
    hospital.tsx         (novo — frases hospital)
  components/
    VLibrasPlayer.tsx    (novo — embed dirigido)
    TextToSignPanel.tsx  (novo)
    QuizEngine.tsx       (novo)
    HospitalGrid.tsx     (novo)
    AlphabetBanner.tsx   (existente — reuso)
  lib/
    libras.functions.ts  (existente + nova fn lookupSigns, saveHistory)
    signs.functions.ts   (novo — listSigns, listCategorias, listFrasesHospital, saveProgresso, sendFeedback, sendContribuicao)
  integrations/supabase/ (gerado pelo Cloud)
```

Server fns autenticadas usam `requireSupabaseAuth` quando precisam de `user_id`; reads públicos usam fns públicas com `supabaseAdmin` filtrando `aprovado=true`.

---

## 7. O que NÃO entra agora (roadmap explícito)

Para combinarmos as próximas iterações:

- **Videoconferência com tradução ao vivo** (WebRTC + tradução streaming).
- **API pública REST** (`/api/public/translate`, `/api/public/signs`) + chaves por cliente.
- **IA contextual de aprendizado contínuo** (fine-tuning com `contribuicoes_sinais` validadas, embeddings semânticos de sinais).
- **Avatar 3D próprio** (substituir/complementar VLibras com Three.js + animações customizadas).
- **Reconhecimento sequencial avançado** (LSTM/Transformer treinado, hoje é heurística).
- **App mobile** Android/iOS (Capacitor).
- **Painel administrativo** para aprovar `contribuicoes_sinais` e `feedbacks`.
- **Importação automática do dicionário VLibras** e outros corpus públicos.

---

## 8. Ordem de execução

1. Ativar Lovable Cloud + migration (schema + seeds + RLS + GRANTs).
2. Server functions de leitura (`listCategorias`, `listSigns`, `listFrasesHospital`, `lookupSigns`).
3. `VLibrasPlayer` + `/traduzir`.
4. `/hospital` (depende de `frases_hospital` + VLibrasPlayer).
5. `/aprender` (depende de `recognizeLetter` já existente + `progresso_educacao`).
6. Auth opcional (email/senha) + persistência de histórico/progresso.
7. Header global + dark mode + revisão de acessibilidade.
8. Smoke test em todas as rotas + checagem de build.

Estimativa: entrego tudo isto em uma única iteração contínua assim que aprovar.

Pode aprovar pra eu começar, ou ajustar qualquer ponto antes.
