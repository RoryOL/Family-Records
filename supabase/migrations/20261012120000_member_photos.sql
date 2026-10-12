-- Pictures for household members.
-- Private bucket member-photos. Object path is {family_group_id}/{member_id}.jpg.
-- The app mints a signed URL when it loads the directory.

alter table public.members
  add column if not exists photo_path text;

alter table public.members
  drop constraint if exists members_photo_path_length;

alter table public.members
  add constraint members_photo_path_length check (photo_path is null or char_length(photo_path) between 1 and 240);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-photos', 'member-photos', false, 5242880, array['image/jpeg'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- The first folder is the household id. A non-uuid folder returns null so the policy stays false.
create or replace function public.photo_group_id(object_name text)
returns uuid
language sql
stable
set search_path = public
as $$
  select case
    when (storage.foldername(object_name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then (storage.foldername(object_name))[1]::uuid
    else null
  end;
$$;

revoke all on function public.photo_group_id(text) from public;
revoke all on function public.photo_group_id(text) from anon;
grant execute on function public.photo_group_id(text) to authenticated;

drop policy if exists "Household members read pictures" on storage.objects;
create policy "Household members read pictures"
on storage.objects for select
to authenticated
using (
  bucket_id = 'member-photos'
  and public.photo_group_id(name) is not null
  and public.is_family_member(public.photo_group_id(name))
);

drop policy if exists "Household members add pictures" on storage.objects;
create policy "Household members add pictures"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'member-photos'
  and public.photo_group_id(name) is not null
  and public.is_family_member(public.photo_group_id(name))
);

drop policy if exists "Household members replace pictures" on storage.objects;
create policy "Household members replace pictures"
on storage.objects for update
to authenticated
using (
  bucket_id = 'member-photos'
  and public.photo_group_id(name) is not null
  and public.is_family_member(public.photo_group_id(name))
)
with check (
  bucket_id = 'member-photos'
  and public.photo_group_id(name) is not null
  and public.is_family_member(public.photo_group_id(name))
);

drop policy if exists "Household members remove pictures" on storage.objects;
create policy "Household members remove pictures"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'member-photos'
  and public.photo_group_id(name) is not null
  and public.is_family_member(public.photo_group_id(name))
);
