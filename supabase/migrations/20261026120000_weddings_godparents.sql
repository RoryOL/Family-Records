-- A wedding date sits on a partner link. Each person can name two godparents, from the household or by name.

alter table public.member_relations
  add column if not exists wedding_date date;

alter table public.member_relations
  drop constraint if exists member_relations_wedding_kind;

alter table public.member_relations
  add constraint member_relations_wedding_kind check (wedding_date is null or kind = 'spouse');

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
  if new.kind <> 'spouse' then
    new.wedding_date := null;
  end if;
  new.family_group_id := from_group;
  return new;
end;
$$;

create table if not exists public.godparents (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references public.family_groups (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  slot smallint not null,
  godparent_member_id uuid references public.members (id) on delete set null,
  godparent_name text not null default '',
  created_at timestamptz not null default now(),
  constraint godparents_slot check (slot in (1, 2)),
  constraint godparents_one_slot unique (member_id, slot),
  constraint godparents_not_self check (godparent_member_id is null or godparent_member_id <> member_id),
  constraint godparents_name_length check (char_length(godparent_name) <= 80),
  constraint godparents_has_person check (godparent_member_id is not null or char_length(btrim(godparent_name)) > 0)
);

create index if not exists godparents_member_idx on public.godparents (member_id);
create index if not exists godparents_godparent_idx on public.godparents (godparent_member_id);
create index if not exists godparents_group_idx on public.godparents (family_group_id);

create or replace function public.godparent_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  child_group uuid;
  parent_group uuid;
begin
  select family_group_id into child_group from public.members where id = new.member_id;
  if child_group is null then
    raise exception 'That person is not in the household.';
  end if;
  if new.godparent_member_id is not null then
    select family_group_id into parent_group from public.members where id = new.godparent_member_id;
    if parent_group is null or parent_group <> child_group then
      raise exception 'Those people are not in the same household.';
    end if;
  end if;
  new.family_group_id := child_group;
  return new;
end;
$$;

drop trigger if exists godparents_group on public.godparents;
create trigger godparents_group
before insert or update on public.godparents
for each row execute function public.godparent_group();

alter table public.godparents enable row level security;

drop policy if exists godparents_all on public.godparents;
create policy godparents_all on public.godparents
for all to authenticated
using (public.is_family_member(family_group_id))
with check (public.is_family_member(family_group_id));

revoke all on public.godparents from public, anon;
grant select, insert, update, delete on public.godparents to authenticated;

revoke all on function public.godparent_group() from public;
grant execute on function public.godparent_group() to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'godparents'
    ) then
      alter publication supabase_realtime add table public.godparents;
    end if;
  end if;
end;
$$;
