# Kinfolk

A family directory for people, birthdays, and mailing addresses. Profiles live in an in-memory store so the interface can be used before Supabase is connected.

## Run

```bash
npm install
npm run dev
```

`npm test` checks the store, directory filters, the member form, birthday windows, and postal formatting. `npm run build` typechecks and builds the Vite app.

## Layout

```
src/
  types/index.ts                 Member, Address, FamilyGroup, and related contracts
  data/mockFamily.ts             The Harpers mock household
  directory/                     Cards, table, search, and the member drawer
  lib/                           Dates, birthdays, addresses, and member helpers
  store/FamilyProvider.tsx       FamilyProvider and useFamily()
```

The directory at `/` searches by name or relationship, filters by relationship tag, and switches between cards and a table. `/members/new` and `/members/:id` open the profile drawer. Edits stay in the tab. Reloading restores the sample household.

## Later

The birthday dashboard, greeting-card export, spreadsheet import, and Supabase auth with row level security build on these types. SheetJS, Papa Parse, and the Supabase client are not installed yet.
