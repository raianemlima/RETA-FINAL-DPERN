-- Trilha dos Informativos STF/STJ do cronograma: quais informativos o aluno já marcou como lidos.
create table if not exists public.informativos_lidos (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tribunal text not null check (tribunal in ('STF', 'STJ')),
  numero integer not null check (numero between 1 and 99999),
  lido_em timestamptz not null default now(),
  primary key (user_id, tribunal, numero)
);
alter table public.informativos_lidos enable row level security;
create policy informativos_lidos_own on public.informativos_lidos for all
  using (user_id = (select auth.uid()) and (select public.is_active_student()))
  with check (user_id = (select auth.uid()) and (select public.is_active_student()));
