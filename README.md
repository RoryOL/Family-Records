# Family Records

A family directory for people, birthdays, and mailing addresses. Accounts, households, and profiles are stored in Supabase. Members of a household can read and update the directory. Someone with the invite code can join as an editor.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with the project URL and the anon key from Supabase → Project Settings → API. Leave the service role key out of the app.

In the Supabase SQL editor, run `supabase/migrations/20260922120000_family_records_household.sql`, then `supabase/migrations/20261012120000_member_photos.sql`. The second file adds a private picture for each person. Under Authentication → URL configuration, set the site URL to this app so confirmation links return here.

`npm test` checks the store, directory filters, the member form, pictures, birthday windows, calendar export, mailing labels, spreadsheet import, the Supabase row mapping, and the home-screen hint. `npm run build` typechecks and builds the Vite app. `npm run preview` serves that build, including the service worker.

## Install

The production build is an installable app. On Chrome or Edge, open Family Records and choose **Install app**. On iPhone or iPad, open the Share menu and choose **Add to Home Screen**.

`http://localhost:5173` can be installed on the computer running the dev server. A phone adds the browser app from a public HTTPS address. The service worker is registered in the production build, so install from `npm run build` and `npm run preview`, or from the deployed site.

## Android

The phone app is an APK. After it is installed, Family Records opens on the phone and stores the household in Supabase.

GitHub builds the package. Under the repository’s Settings → Secrets and variables → Actions, add:

- `VITE_SUPABASE_URL`, the project URL from Supabase → Project Settings → API
- `VITE_SUPABASE_ANON_KEY`, the anon key from that same page

Open Actions → Android APK and download `family-records.apk` from the run. On a pull request, the same file is attached to the Android APK check. Copy it to the phone and open it to install. Android will ask you to allow installation from that source.

A build on a machine with a JDK, the Android SDK, and `ANDROID_HOME` uses:

```bash
npm run android:apk
```

That package is `android/app/build/outputs/apk/debug/app-debug.apk`.

Under Supabase → Authentication → URL configuration, add `familyrecords://auth-callback` to the redirect allow list. Confirmation links then open the installed app. Sign-in for an account that is already confirmed works as soon as the APK is installed.

## Layout

```
src/
  types/index.ts                 Member, Address, FamilyGroup, and related contracts
  data/mockFamily.ts             Harper sample drafts for an empty household
  auth/                          Sign-in, create household, and join with an invite
  supabase/                      Client, row mapping, and household reads and writes
  directory/                     Cards, table, search, and the member drawer
  birthdays/                     7, 30, and 90 day birthday tracker
  cards/                         Greeting-card addresses, copy, and CSV export
  import/                        Spreadsheet drop, column mapping, and review
  shell/                         Navigation and the 7-day reminder banner
  pwa/                           Install prompt and the iOS home-screen hint
  native/                        Android shell, status bar, and confirmation links
  lib/                           Dates, birthdays, calendar, addresses, and member helpers
  store/FamilyProvider.tsx       FamilyProvider and useFamily()
supabase/migrations/             Household tables, invite functions, pictures, and row level security
```

`/` is the directory. `/birthdays` lists upcoming birthdays and downloads an `.ics` calendar. `/cards` shows verified mailing addresses, with copy and CSV export. `/import` accepts a CSV, XLS, or XLSX file, maps the columns, and adds the rows that pass the check.

Sign in with email and password. Create a household, or join one with its invite code. The code is on the directory header. Editors can read and update people. Imported and new addresses stay unverified until someone marks them for mail. An empty household can add the Harper sample so the birthday and mailing screens have people to show.
