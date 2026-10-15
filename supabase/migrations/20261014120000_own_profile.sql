-- One signed-in account maps to one person. A household editor can still update that person's details.

create unique index members_linked_user_idx on public.members (linked_user_id) where linked_user_id is not null;

create or replace function public.guard_member_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.linked_user_id is not distinct from old.linked_user_id then
    return new;
  end if;

  if new.linked_user_id is not null and new.linked_user_id is distinct from auth.uid() then
    raise exception 'A profile can only be linked to the person who is signed in.';
  end if;

  if tg_op = 'UPDATE' and old.linked_user_id is not null and new.linked_user_id is distinct from old.linked_user_id then
    raise exception 'That profile is already linked to an account.';
  end if;

  return new;
end;
$$;

create trigger members_guard_link
before insert or update on public.members
for each row execute function public.guard_member_link();

create policy family_users_update_own on public.family_users
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant update (display_name) on public.family_users to authenticated;

revoke all on function public.guard_member_link() from public;
