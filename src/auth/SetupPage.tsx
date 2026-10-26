import { surfaceClass } from "../directory/styles";
import { GateFrame } from "./GateFrame";

export function SetupPage() {
  return (
    <GateFrame
      title="Connect Supabase"
      lede="Family Records stores the household in your Supabase project. Add the project URL and anon key, then apply the migration."
    >
      <section className={`${surfaceClass} mt-8 max-w-2xl min-w-0 p-6 sm:p-8`}>
        <h2 className="font-display text-2xl font-bold tracking-tight">Project keys</h2>
        <p className="mt-3 break-words text-sm text-stone-500">
          Copy <code className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">.env.example</code> to{" "}
          <code className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">.env</code> and fill in the anon key from the Supabase API settings. The service role key stays on the server.
        </p>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-850">
          {`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <h2 className="mt-8 font-display text-2xl font-bold tracking-tight">Database</h2>
        <p className="mt-3 break-words text-sm text-stone-500">
          In the Supabase SQL editor, run <code className="break-all rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">supabase/migrations/20260922120000_family_records_household.sql</code>. That creates the household, the directory, and the row level security policies. Members of a household can read and update people. The invite functions add the owner and later editors. Then run <code className="break-all rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">supabase/migrations/20261012120000_member_photos.sql</code> so each person can have a picture. Then run <code className="break-all rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">supabase/migrations/20261013120000_member_relations.sql</code> so people can be linked as parent, child, sibling, or partner. Then run <code className="break-all rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">supabase/migrations/20261013120000_app_releases.sql</code> so the phone can download a newer APK. Then run <code className="break-all rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">supabase/migrations/20261014120000_own_profile.sql</code> so the signed-in person can keep their own birthdate, address, and relationships. Then run <code className="break-all rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">supabase/migrations/20261026120000_weddings_godparents.sql</code> so each person can name two godparents. Then run <code className="break-all rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">supabase/migrations/20261026230000_married_relationship.sql</code> so a marriage is separate from a partner and only a marriage keeps a date.
        </p>
        <p className="mt-3 break-words text-sm text-stone-500">Restart the dev server after saving the env file. Under Authentication, set the site URL to this app so confirmation links return here.</p>
      </section>
    </GateFrame>
  );
}
