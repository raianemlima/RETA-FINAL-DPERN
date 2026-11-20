# Cursos DUO · Reta Final DPE-RN

App de estudo só de conteúdo para os alunos do curso **Reta Final DPE-RN** (Defensoria Pública do Rio Grande do Norte,
banca **Cebraspe**): o aluno lê os ebooks no PC ou no celular,
grifa, anota, revisa num caderno e exporta o caderno em PDF com a identidade do DUO. Não há IA: todo texto exibido é o
texto original do material.

Cópia do app do **Reta Final DPE-SP** (repositório `-home-user-duo-reta-final`, em 20/11/2026), com a identidade do
curso trocada. Tudo o que muda de um Reta Final para outro fica em **`lib/course.ts`**: nome do curso, defensoria,
banca e data da prova. **Quando o edital sair**, preencha `examDate` (ex.: `"2027-05-16"`) e `examLabel`
(ex.: `"domingo, 16 de maio de 2027"`) ali: a contagem regressiva volta a aparecer na página inicial e no menu.

Derivado do [Ateliê do Conhecimento](https://github.com/raianemlima/atelie-do-conhecimento) (extração, limpeza,
segmentação e motor de etapas). Design: `docs/superpowers/specs/`. Plano: `docs/superpowers/plans/`.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha com o projeto Supabase
npm run dev
```

- Testes: `npm test` · tipos: `npx tsc --noEmit` · lint: `npm run lint`
- Banco (Postgres descartável): `bash tests/db/verify.sh` — aplica, reverte e reaplica as migrações e confere o isolamento por RLS entre alunos, aluno inativo e equipe, a publicação atômica e o limite de uso
- Navegador: `npm run build && npm run test:e2e`. Com o Supabase simulado (telas do aluno sob a política de conteúdo),
  construa com `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` e rode `E2E_SUPABASE_MOCK=1 npm run test:e2e`.
  A CI (`.github/workflows/ci.yml`) roda os três em cada PR.

## Variáveis

| Variável | Onde | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | público | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | público | chave publicável |
| `SUPABASE_SERVICE_ROLE_KEY` | só servidor | criação de alunos e reancoragem de grifos |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | público | chave pública dos avisos no celular (Web Push) |
| `VAPID_PRIVATE_KEY` | só servidor | chave privada dos avisos; gere o par com `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | só servidor | contato dos avisos, ex.: `mailto:equipe@cursosduo.com.br` |
| `ALUNO_SENHA_PADRAO` | só servidor | senha inicial dos alunos criados em Equipe › Alunos (não versionar) |
| `NEXT_PUBLIC_SITE_URL` | público | endereço público do app; só mude se o domínio mudar (padrão: `https://reta-final-dpern.vercel.app`) |

Os ebooks do curso **não** são versionados neste repositório (direitos autorais).

## Publicar (Supabase + Vercel)

1. **Supabase**: crie um projeto **novo**, só para o DPE-RN (não use o do DPE-SP: alunos, grifos e materiais são
   separados). Aplique as migrações em ordem (`supabase/migrations/0001…0021`, sem os arquivos `.down`
   e **sem a 0005**, que o próprio atelie marca como não aplicada: ela exige que o envio de documentos use a chave de serviço).
   Para conferir até onde ele está, rode no SQL Editor `select to_regclass('public.vade_esperto') as m0017, to_regprocedure('public.publish_content_version(uuid)') as m0019, to_regclass('public.rate_limits') as m0020, to_regclass('public.study_activity_done') as m0021;`
   (vazio = migração ainda não aplicada). A 0019 (publicação atômica) e a 0020 (limite de uso) podem ser aplicadas antes ou
   depois do deploy: sem elas o app continua funcionando, publicando em dois passos e sem o limite. O mesmo vale para a 0021
   (atividades concluídas do cronograma): sem ela, o cronograma só não mostra o botão "Atividade concluída".
2. **Auth** (Authentication → Providers/Settings):
   - desligue o cadastro aberto ("Allow new users to sign up");
   - em URL Configuration, adicione `https://SEU_DOMINIO/auth/confirm` às Redirect URLs;
   - alunos criados em Equipe › Alunos entram com a senha padrão (`ALUNO_SENHA_PADRAO`) e são levados a **trocar a senha no primeiro acesso**;
     cada aluno só mantém **uma sessão ativa** (ao entrar em outro aparelho, o anterior é encerrado; a equipe pode usar vários);
   - o login é por **e-mail e senha**: não depende de e-mail enviado pelo Supabase. Só entra quem foi criado em
     Equipe › Alunos (ou em Authentication → Users); com o cadastro aberto desligado, ninguém mais se cria.
3. **Primeiro usuário da equipe**: convide pelo painel do Supabase e rode no SQL Editor:
   `insert into public.profiles(user_id, email, role) select id, email, 'equipe' from auth.users where email = 'equipe@cursosduo.com.br';`
4. **Vercel**: importe o repositório e defina `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `NEXT_PUBLIC_PIPELINE_V2=true` e `SUPABASE_SERVICE_ROLE_KEY` (esta só no servidor).

   Crie um projeto **novo** na Vercel a partir deste repositório. O endereço previsto é
   **https://reta-final-dpern.vercel.app** (se o nome mudar, ajuste `NEXT_PUBLIC_SITE_URL`). Cada merge em `main`
   publica ali por dois caminhos, e basta um funcionar:

   - a **integração Git da Vercel** (Project › Settings › Git), que publica sozinha o que entra em `main`; e
   - o workflow **Deploy produção** (`.github/workflows/deploy.yml`), que roda a cada push em `main` e também
     manualmente, e depende do segredo `VERCEL_TOKEN` e da variável `VERCEL_PROJECT_ID` (o id `prj_…` do projeto
     DPE-RN, em Project › Settings › General) em Settings › Secrets and variables › Actions.

   Se a atualização não aparecer no domínio, confira nessa ordem: o domínio está em Project › Settings › Domains
   como **Production**; a integração Git está conectada a este repositório com `main` como Production Branch; e o
   segredo `VERCEL_TOKEN` existe (sem ele o workflow termina avisando, sem publicar).
5. Entre como equipe e carregue o material (ele fica no Supabase, nunca neste repositório, que é público):
   - **Equipe › Conteúdo**: crie as disciplinas e envie os ebooks do Reta Final DPE-RN (Word ou PDF), confira a prévia e publique.
   - **Equipe › Vade Esperto**: envie um PDF por matéria (há Vade Mecum DPE-RN de Constitucional, Administrativo, Civil,
     CPC, Penal, CPP, LEP, Legislação Penal Especial, ECA, Consumidor, Difusos, Direitos Humanos e Princípios Institucionais).
   - **Equipe › Cronogramas**: envie os cronogramas de 3h, 4h e 6h em Word (.docx).
   - **Equipe › Alunos**: cole a lista de e-mails.

## Segurança

- **Sessão e papéis** são conferidos no proxy (`proxy.ts`) a cada requisição; o acesso aos dados é limitado pela RLS.
- **Política de conteúdo** (`lib/csp.ts`): cada resposta tem um nonce novo, e só roda script com ele (o Next o põe nos
  scripts que gera). O navegador só conversa com o app e o Supabase, e o app não abre dentro de outro site
  (`frame-ancestors 'none'` e `X-Frame-Options: DENY`). Um serviço novo que o navegador precise acessar entra em
  `connect-src`; um componente do navegador não pode importar módulos de servidor (o `tests/e2e/csp.spec.ts` acusa).
- **Limite de uso** (migração 0020): por aluno, 30 PDFs protegidos e 10 exportações do caderno a cada 10 minutos.
- **Publicação** (migração 0019): a versão anterior é arquivada e a nova publicada na mesma transação.

## Ensaio com os ebooks reais

`ENSAIO_DIR=/pasta/com/os/ebooks [ENSAIO_BASE=antigo.pdf ENSAIO_NOVA=novo.pdf] npm run ensaio` gera
`ensaio-relatorio.md` (os arquivos não entram no repositório).

Resultado em 20/11/2026, com os 6 ebooks do Reta Final DPE-RN já prontos (Word, pasta do Drive):

| Ebook | Seções | Parágrafos | Resíduos de cabeçalho/rodapé |
|---|---|---|---|
| Administrativo | 46 | 502 | 0 |
| CDC e Difusos | 46 | 792 | 0 |
| Civil | 91 | 1095 | 0 |
| Constitucional | 73 | 868 | 0 |
| Direitos Humanos | 39 | 468 | 0 |
| Processo Civil | 74 | 864 | 0 |

- Os seis abrem, viram seções pelos títulos do Word e não deixam ruído de diagramação. Envie **o Word (.docx)**:
  o sumário automático do Word é ignorado e a navegação sai dos títulos.
- Os resultados do DPE-SP (11 ebooks em PDF, tabelas do PDF conferidas contra o Word) estão no README daquele repositório.

## Banco de questões

As questões vêm do repositório REVIEW-RAI (`ferramentas/conteudo/dados/simulados/*.json`) e ficam em `data/questoes.json`. A regra `keep` do importador já está ajustada para o DPE-RN: entram as da própria DPE-RN e as de Defensor do
**Cebraspe** de 2021 em diante; questões Certo/Errado entram com as alternativas C (Certo) e E (Errado).
**Atenção:** o `data/questoes.json` ainda é o banco copiado do DPE-SP (provas da DPE-SP e de Defensor da FCC). Rode o
importador com o REVIEW-RAI para trocar pelo banco do Cebraspe; a fundamentação (`data/fundamentacoes.json`) vale por id
de questão, então as questões novas entram sem fundamentação até ela ser conferida.
Para atualizar depois de mudar as questões lá: `node scripts/questoes/importar.mjs /caminho/para/review-rai`, confira e faça o commit.
As respostas de cada aluno ficam na tabela `question_answers` (migração 0015).

### Fundamentação do gabarito

`data/fundamentacoes.json` guarda, por questão, a fundamentação conferida nas fontes: uma nota ligando o
dispositivo à alternativa correta, os dispositivos e a data da conferência. Cada dispositivo diz o que é:

- `tipo: "lei"` — **transcrição literal** do dispositivo, com `url` da página oficial de onde o texto veio
  (Portal da Legislação do Planalto, em regra o *texto compilado*);
- `tipo: "entendimento"` — **resumo** da posição do tribunal ou do órgão (STF, STJ, Corte IDH, CIDH, OIT…),
  ou da construção doutrinária. A tela rotula como resumo, para o aluno não confundir com lei seca.

Quando a conferência não fecha, o campo `ressalva` aparece em destaque na tela do aluno: gabarito oficial
discutível, duas alternativas corretas, questão superada por lei nova, norma estadual ou interna de outra
Defensoria que não foi possível conferir, ou tese que só se sustenta em doutrina.

A fundamentação vai ao aparelho sob demanda (`GET /api/questoes/[id]/fundamentacao`), quando o aluno já viu
a correção: o texto de lei inteiro na primeira carga pesaria no celular.

Confira o arquivo com `node scripts/questoes/conferir-fundamentacao.mjs` (`--cobertura` mostra o andamento
por disciplina). Os mesmos invariantes estão em `tests/duo/questions.test.ts`.

As transcrições do tipo `lei` são conferidas palavra por palavra contra a página oficial com
`node scripts/questoes/conferir-transcricao.mjs` (baixa cada `url` uma vez e guarda em `.cache/leis`).

## Cronograma de estudos

O aluno escolhe, na página inicial, o **cronograma oficial de 4h ou de 6h por dia** ou envia o dele. Os oficiais são
enviados em Word (.docx) pela equipe em **Equipe › Cronogramas** e ficam no bucket privado `cronogramas`, pasta
`oficiais/` (não são versionados aqui: são material do curso). A escolha de cada aluno fica em `study_plan_choices`
(migração 0016).

Em `/cronograma` o Word é lido no app (`lib/study-plan-view.ts`): o HTML é limpo (só formatação, tabelas e links
http/https, que abrem fora do app), dividido pelos títulos dos dias ("SEGUNDA-FEIRA"… "DOMINGO · SIMULADO") e, depois
dos dias, cada título vira um anexo (as trilhas por disciplina). As tabelas "ATIVIDADE n | TEMPO" viram a lista do dia,
com os links de cada atividade; "Questões do dia" abre primeiro o banco de questões do app nas disciplinas do dia.

Cada atividade tem o botão **Atividade concluída**: a tela mostra quantas o aluno fez no dia e na semana, e o dia
todo feito ganha ✓ na aba. Como o cronograma se repete toda semana, a marcação vale para a data daquele dia na semana
atual e recomeça na segunda-feira seguinte. Fica em `study_activity_done` (migração 0021), pela rota
`/api/cronograma/progresso`.

## Vade Esperto

Um PDF por matéria no bucket privado `vade-esperto` (`<slug>.pdf`); a tabela `vade_esperto` guarda a data de atualização
que o aluno vê (migração 0017). O catálogo e o vínculo com o cronograma ("Vade Esperto – Processo Penal" → `processo-penal`)
estão em `lib/vade.ts`. O aluno abre em **Vade** (menu) ou direto pela atividade do cronograma; a equipe troca os PDFs em
**Equipe › Vade Esperto** (a data do nome do arquivo, "atualizado em 14.09.26", vira a data exibida).

No leitor, cada Vade Esperto é uma disciplina "Vade Esperto – <matéria>" (endereço `vade-esperto-…`), já criada para as
12 matérias: em **Equipe › Conteúdo**, envie o **Word (.docx)** de cada uma (sai bem mais limpo que o PDF, que tem notas
laterais) e publique. Ela fica fora da lista de ebooks; a página Vade Esperto e o cronograma passam a abrir o leitor
("Ler no app"), com grifos, anotações e caderno. No Word, os nomes das leis viram títulos do sumário quando têm estilo
de título ou "nível de tópico"; o sumário automático do Word é ignorado.
