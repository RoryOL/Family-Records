-- A step-parent is recorded only when the household says so.
-- The partner or spouse of a parent is a parent unless this link says otherwise.
-- Step links point from the step-parent to the child, the same way parent links do.

alter table public.member_relations
  drop constraint if exists member_relations_kind;

alter table public.member_relations
  add constraint member_relations_kind check (kind in ('parent', 'spouse', 'sibling', 'married', 'step'));

alter table public.member_relations
  drop constraint if exists member_relations_ordered;

alter table public.member_relations
  add constraint member_relations_ordered check (
    kind in ('parent', 'step') or from_member_id::text < to_member_id::text
  );
