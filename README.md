# Kinfolk

A family directory for people, birthdays, and mailing addresses. Profiles live in an in-memory store so the interface can be used before Supabase is connected.

## Run

```bash
npm install
npm run dev
```

`npm test` checks the store, directory filters, the member form, birthday windows, calendar export, and mailing labels. `npm run build` typechecks and builds the Vite app.

## Layout

```
src/
  types/index.ts                 Member, Address, FamilyGroup, and related contracts
  data/mockFamily.ts             The Harpers mock household
  directory/                     Cards, table, search, and the member drawer
  birthdays/                     7, 30, and 90 day birthday tracker
  cards/                         Greeting-card addresses, copy, and CSV export
  import/                        Spreadsheet drop, column mapping, and review
  shell/                         Navigation and the 7-day reminder banner
  lib/                           Dates, birthdays, calendar, addresses, and member helpers
  store/FamilyProvider.tsx       FamilyProvider and useFamily()
```

`/` is the directory. `/birthdays` lists upcoming birthdays and downloads an `.ics` calendar. `/cards` shows verified mailing addresses, with copy and CSV export. `/import` accepts a CSV, XLS, or XLSX file, maps the columns, and adds the rows that pass the check. Edits stay in the tab. Reloading restores the sample household.

## Later

Supabase auth with row level security is not built yet. The Supabase client is not installed.
