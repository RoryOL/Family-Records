-- A marriage is its own link. Only a marriage keeps a date.
-- Partner links stay. A partner link that already has a wedding date becomes a marriage.

alter table public.member_relations
  drop constraint if exists member_relations_kind;

alter table public.member_relations
  add constraint member_relations_kind check (kind in ('parent', 'spouse', 'sibling', 'married'));

-- Replace the trigger before converting rows. The previous trigger cleared a date
-- on any link that was not a partner, which would wipe these dates during the update.
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
  if new.kind <> 'married' then
    new.wedding_date := null;
  end if;
  new.family_group_id := from_group;
  return new;
end;
$$;

alter table public.member_relations
  drop constraint if exists member_relations_wedding_kind;

update public.member_relations
set kind = 'married'
where kind = 'spouse' and wedding_date is not null;

alter table public.member_relations
  drop constraint if exists member_relations_married_date;

alter table public.member_relations
  add constraint member_relations_married_date check (wedding_date is null or kind = 'married');
