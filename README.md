# Kinfolk

A family directory for people, birthdays, and mailing addresses. This pass is the local foundation: TypeScript models, a mock household, and an in-memory store the interface can read without Supabase.

## Run

```bash
npm install
npm run dev
```

`npm test` checks the store, birthday windows, and postal formatting. `npm run build` typechecks and builds the Vite app.

## Layout

```
src/
  types/index.ts            Member, Address, FamilyGroup, and related contracts
  data/mockFamily.ts        The Harpers mock household
  lib/dates.ts              Calendar dates
  lib/birthdays.ts          Next birthday and 7 / 30 / 90 day windows
  lib/address.ts            Postal blocks and greeting-card labels
  lib/members.ts            Create, update, and search helpers
  store/familyReducer.ts    Add, update, remove, reset
  store/FamilyProvider.tsx  FamilyProvider and useFamily()
  preview/StorePreview.tsx  Read-only inspection of the mock store
```

`useFamily()` exposes the current group, signed-in user, members, and `addMember`, `updateMember`, `removeMember`, and `reset`. Data lives in memory. A reload restores the mock household.

The Harper birthdays are placed so that on 21 September 2026 the preview shows a birthday today, two more inside 7 days, one more inside 30 days, and two more inside 90 days.

## Later

Directory search and editing, the birthday dashboard, greeting-card export, spreadsheet import, and Supabase auth with row level security build on these types. React Router, SheetJS, Papa Parse, and the Supabase client are not installed yet.
