-- A household can record that someone has died, and the date when that is known.
-- Birthdays and greeting cards leave that person out.

alter table public.members
  add column if not exists deceased boolean not null default false;

alter table public.members
  add column if not exists date_of_death date;

alter table public.members
  drop constraint if exists members_death_not_before_birth;

alter table public.members
  add constraint members_death_not_before_birth check (
    date_of_death is null
    or date_of_birth is null
    or date_of_death >= date_of_birth
  );

alter table public.members
  drop constraint if exists members_death_date_marks_deceased;

alter table public.members
  add constraint members_death_date_marks_deceased check (
    date_of_death is null or deceased
  );
