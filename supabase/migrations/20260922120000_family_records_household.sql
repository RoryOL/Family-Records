-- Family Records household: one family group per account, shared directory, invite to join.
-- Authenticated members can read and update people. The anon key cannot.

create table public.family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_groups_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint family_groups_description_length check (char_length(description) <= 280)
);

create table public.family_users (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references public.family_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  email text not null default '',
  role text not null,
  joined_at timestamptz not null default now(),
  constraint family_users_role check (role in ('owner', 'editor')),
  constraint family_users_display_name_length check (char_length(btrim(display_name)) between 1 and 80),
  constraint family_users_one_household unique (user_id)
);

create index family_users_group_idx on public.family_users (family_group_id);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references public.family_groups (id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  full_name text not null,
  relationship text not null default '',
  date_of_birth date,
  phone text,
  email text,
  notes text not null default '',
  linked_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_first_name_length check (char_length(btrim(first_name)) between 1 and 80)
);

create index members_group_idx on public.members (family_group_id);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.members (id) on delete cascade,
  format text not null,
  line1 text not null default '',
  line2 text not null default '',
  line3 text not null default '',
  city text not null default '',
  region text not null default '',
  postal_code text not null default '',
  country text not null default '',
  verified boolean not null default false,
  constraint addresses_format check (format in ('ie', 'international'))
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger family_groups_updated_at
before update on public.family_groups
for each row execute function public.set_updated_at();

create trigger members_updated_at
before update on public.members
for each row execute function public.set_updated_at();

create or replace function public.is_family_member(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_users
    where family_users.user_id = auth.uid()
      and family_users.family_group_id = group_id
  );
$$;

create or replace function public.is_family_owner(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_users
    where family_users.user_id = auth.uid()
      and family_users.family_group_id = group_id
      and family_users.role = 'owner'
  );
$$;

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  body text := '';
  i int;
begin
  for i in 1..8 loop
    body := body || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return substr(body, 1, 4) || '-' || substr(body, 5, 4);
end;
$$;

create or replace function public.account_display_name()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  display_name text := btrim(coalesce(auth.jwt() -> 'user_metadata' ->> 'display_name', ''));
begin
  if display_name = '' then
    display_name := split_part(email, '@', 1);
  end if;
  if display_name = '' then
    display_name := 'Family member';
  end if;
  return left(display_name, 80);
end;
$$;

create or replace function public.create_family_group(household_name text, household_description text default '')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  gid uuid;
  code text;
  attempts int := 0;
begin
  if uid is null then
    raise exception 'Sign in before creating a household.';
  end if;

  if exists (select 1 from public.family_users where user_id = uid) then
    raise exception 'This account is already in a household.';
  end if;

  if char_length(btrim(coalesce(household_name, ''))) = 0 or char_length(btrim(household_name)) > 80 then
    raise exception 'Enter a household name.';
  end if;

  if char_length(btrim(coalesce(household_description, ''))) > 280 then
    raise exception 'Keep the description under 280 characters.';
  end if;

  while attempts < 5 loop
    code := public.generate_invite_code();
    begin
      insert into public.family_groups (name, description, invite_code)
      values (btrim(household_name), btrim(coalesce(household_description, '')), code)
      returning id into gid;
      exit;
    exception
      when unique_violation then
        attempts := attempts + 1;
        gid := null;
    end;
  end loop;

  if gid is null then
    raise exception 'A household could not be created. Try again.';
  end if;

  begin
    insert into public.family_users (family_group_id, user_id, display_name, email, role)
    values (gid, uid, public.account_display_name(), lower(coalesce(auth.jwt() ->> 'email', '')), 'owner');
  exception
    when unique_violation then
      raise exception 'This account is already in a household.';
  end;

  return gid;
end;
$$;

create or replace function public.join_family_group(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  gid uuid;
  normalized text := upper(regexp_replace(coalesce(invite_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if uid is null then
    raise exception 'Sign in before joining a household.';
  end if;

  if exists (select 1 from public.family_users where user_id = uid) then
    raise exception 'This account is already in a household.';
  end if;

  if char_length(normalized) < 4 then
    raise exception 'That invite code does not match a household.';
  end if;

  select family_groups.id
  into gid
  from public.family_groups
  where regexp_replace(family_groups.invite_code, '[^A-Za-z0-9]', '', 'g') = normalized;

  if gid is null then
    raise exception 'That invite code does not match a household.';
  end if;

  begin
    insert into public.family_users (family_group_id, user_id, display_name, email, role)
    values (gid, uid, public.account_display_name(), lower(coalesce(auth.jwt() ->> 'email', '')), 'editor');
  exception
    when unique_violation then
      raise exception 'This account is already in a household.';
  end;

  return gid;
end;
$$;

alter table public.family_groups enable row level security;
alter table public.family_users enable row level security;
alter table public.members enable row level security;
alter table public.addresses enable row level security;

create policy family_groups_select on public.family_groups
for select to authenticated
using (public.is_family_member(id));

create policy family_groups_update on public.family_groups
for update to authenticated
using (public.is_family_owner(id))
with check (public.is_family_owner(id));

create policy family_users_select on public.family_users
for select to authenticated
using (public.is_family_member(family_group_id));

create policy members_all on public.members
for all to authenticated
using (public.is_family_member(family_group_id))
with check (public.is_family_member(family_group_id));

create policy addresses_all on public.addresses
for all to authenticated
using (
  exists (
    select 1
    from public.members
    where members.id = addresses.member_id
      and public.is_family_member(members.family_group_id)
  )
)
with check (
  exists (
    select 1
    from public.members
    where members.id = addresses.member_id
      and public.is_family_member(members.family_group_id)
  )
);

revoke all on public.family_groups from public, anon;
revoke all on public.family_users from public, anon;
revoke all on public.members from public, anon;
revoke all on public.addresses from public, anon;

grant select on public.family_groups to authenticated;
grant update (name, description) on public.family_groups to authenticated;
grant select on public.family_users to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;

revoke all on function public.set_updated_at() from public;
revoke all on function public.is_family_member(uuid) from public;
revoke all on function public.is_family_owner(uuid) from public;
revoke all on function public.generate_invite_code() from public;
revoke all on function public.account_display_name() from public;
revoke all on function public.create_family_group(text, text) from public;
revoke all on function public.join_family_group(text) from public;

grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.is_family_owner(uuid) to authenticated;
grant execute on function public.create_family_group(text, text) to authenticated;
grant execute on function public.join_family_group(text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'members'
    ) then
      alter publication supabase_realtime add table public.members;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'addresses'
    ) then
      alter publication supabase_realtime add table public.addresses;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'family_users'
    ) then
      alter publication supabase_realtime add table public.family_users;
    end if;
  end if;
end $$;
