-- Links between people in a household, plus an optional gender for niece/nephew and brother/sister.
-- Parent links point from the parent to the child. Partner and sibling links are stored once, with the smaller id first.

alter table public.members
  add column if not exists gender text;

alter table public.members
  drop constraint if exists members_gender;

alter table public.members
  add constraint members_gender check (gender is null or gender in ('female', 'male'));

create table if not exists public.member_relations (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references public.family_groups (id) on delete cascade,
  from_member_id uuid not null references public.members (id) on delete cascade,
  to_member_id uuid not null references public.members (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now(),
  constraint member_relations_kind check (kind in ('parent', 'spouse', 'sibling')),
  constraint member_relations_distinct check (from_member_id <> to_member_id),
  constraint member_relations_ordered check (kind = 'parent' or from_member_id::text < to_member_id::text),
  constraint member_relations_unique unique (from_member_id, to_member_id, kind)
);

create index if not exists member_relations_from_idx on public.member_relations (from_member_id);
create index if not exists member_relations_to_idx on public.member_relations (to_member_id);
create index if not exists member_relations_group_idx on public.member_relations (family_group_id);

create or replace function public.member_relation_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  from_group uuid;
  to_group uuid;
begin
  select family_group_id into from_group from public.members where id = new.from_member_id;
  select family_group_id into to_group from public.members where id = new.to_member_id;
  if from_group is null or to_group is null or from_group <> to_group then
    raise exception 'Those people are not in the same household.';
  end if;
  new.family_group_id := from_group;
  return new;
end;
$$;

drop trigger if exists member_relations_group on public.member_relations;
create trigger member_relations_group
before insert or update on public.member_relations
for each row execute function public.member_relation_group();

alter table public.member_relations enable row level security;

drop policy if exists member_relations_all on public.member_relations;
create policy member_relations_all on public.member_relations
for all to authenticated
using (public.is_family_member(family_group_id))
with check (public.is_family_member(family_group_id));

revoke all on public.member_relations from public, anon;
grant select, insert, update, delete on public.member_relations to authenticated;

revoke all on function public.member_relation_group() from public;
grant execute on function public.member_relation_group() to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'member_relations'
    ) then
      alter publication supabase_realtime add table public.member_relations;
    end if;
  end if;
end;
$$;
