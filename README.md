# Family Records

A family directory for people, birthdays, and mailing addresses. Accounts, households, and profiles are stored in Supabase. Members of a household can read and update the directory. Someone with the invite code can join as an editor.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with the project URL and the anon key from Supabase → Project Settings → API. Leave the service role key out of the app.

In the Supabase SQL editor, run these files in order:

- `supabase/migrations/20260922120000_family_records_household.sql`
- `supabase/migrations/20261012120000_member_photos.sql` adds a private picture for each person
- `supabase/migrations/20261013120000_member_relations.sql` adds links between people so the family tree can name brothers, nieces, and nephews
- `supabase/migrations/20261013120000_app_releases.sql` lets the phone download a newer APK
- `supabase/migrations/20261014120000_own_profile.sql` links the signed-in account to one person in the household

Under Authentication → URL configuration, set the site URL to this app so confirmation links return here.

`npm test` checks the store, directory filters, the member form, pictures, relationships, the family tree, birthday windows, calendar export, mailing labels, spreadsheet import, the Supabase row mapping, the home-screen hint, and the APK update check. `npm run build` typechecks and builds the Vite app. `npm run preview` serves that build, including the service worker.

## Install

The production build is an installable app. On Chrome or Edge, open Family Records and choose **Install app**. On iPhone or iPad, open the Share menu and choose **Add to Home Screen**.

`http://localhost:5173` can be installed on the computer running the dev server. A phone adds the browser app from a public HTTPS address. The service worker is registered in the production build, so install from `npm run build` and `npm run preview`, or from the deployed site.

## Android

The phone app is an APK. After it is installed, Family Records opens on the phone and stores the household in Supabase. A build published from `main` replaces the installed app when its version number is higher.

GitHub builds the package. Under the repository’s Settings → Secrets and variables → Actions, add:

- `VITE_SUPABASE_URL`, the project URL from Supabase → Project Settings → API
- `VITE_SUPABASE_ANON_KEY`, the anon key from that same page
- `SUPABASE_SERVICE_ROLE_KEY`, the service role from that same page

The service role publishes the APK. It is not part of the app. Every APK is signed with `android/app/sideload.keystore`, so a newer file can install over the last one.

Install once from Actions → Android APK → `family-records.apk`. If an older Family Records is already on the phone, uninstall it first. That older package was signed with a different key, and Android will not replace it. Open the new APK and allow installation from that source.

After that, the app checks for a build each time it opens. It downloads the APK and installs it. The first time, Android asks you to allow Family Records to install updates. Later builds install on their own when the phone allows a self-update, and otherwise Android asks you to confirm the install.

A pull request still produces an APK on its Android APK check, but that file is not published to phones.

A build on a machine with a JDK, the Android SDK, and `ANDROID_HOME` uses:

```bash
npm run android:apk
```

That package is `android/app/build/outputs/apk/release/app-release.apk`. A local build is version 1. A GitHub build uses the workflow run number, so the phone prefers the published one.

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
  tree/                          Family tree, one row per generation
  cards/                         Greeting-card addresses, copy, and CSV export
  import/                        Spreadsheet drop, column mapping, and review
  shell/                         Navigation and the 7-day reminder banner
  pwa/                           Install prompt and the iOS home-screen hint
  native/                        Android shell, status bar, and confirmation links
  lib/                           Dates, birthdays, calendar, addresses, and member helpers
  store/FamilyProvider.tsx       FamilyProvider and useFamily()
supabase/migrations/             Household tables, invite functions, pictures, and row level security
```

`/` is the directory. `/me` is where the signed-in person adds their birthdate, address, and relationships. `/tree` shows each generation on its own row, with the eldest person on the left. `/birthdays` lists upcoming birthdays and downloads an `.ics` calendar. `/cards` shows verified mailing addresses, with copy and CSV export. `/import` accepts a CSV, XLS, or XLSX file, maps the columns, and adds the rows that pass the check.

Sign in with email and password. Create a household, or join one with its invite code. The code is on the directory header. Editors can read and update people. Imported and new addresses stay unverified until someone marks them for mail. An empty household can add the Harper sample so the birthday and mailing screens have people to show.
