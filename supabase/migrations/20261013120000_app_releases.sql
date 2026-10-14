-- Public builds of the Android app. The phone downloads these objects.
-- Uploads use the service role from GitHub Actions. The anon key cannot write here.

insert into storage.buckets (id, name, public, file_size_limit)
values ('app-releases', 'app-releases', true, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Anyone can download Family Records builds" on storage.objects;
create policy "Anyone can download Family Records builds"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'app-releases');
