import { Copy, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MemberAvatar } from "../directory/MemberAvatar";
import { pageClass, primaryButtonClass, secondaryButtonClass, surfaceClass } from "../directory/styles";
import { formatAddressBlock, formatMailingLabels } from "../lib/address";
import { downloadFile, fileSlug } from "../lib/download";
import { mailingCsv, verifiedMailingMembers } from "../lib/mailingCsv";
import { useFamily } from "../store/FamilyProvider";

export function CardsPage() {
  const { group, members } = useFamily();
  const ready = verifiedMailingMembers(members);
  const labels = formatMailingLabels(ready);
  const skipped = members
    .filter((member) => !member.address?.verified)
    .slice()
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    document.title = `Greeting cards · ${group.name} · Family Records`;
  }, [group.name]);

  useEffect(() => {
    setCopyState("idle");
  }, [labels]);

  async function copyAll() {
    if (!labels) return;
    try {
      await navigator.clipboard.writeText(labels);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  function exportCsv() {
    downloadFile(`${fileSlug(group.name)}-mailing-labels.csv`, mailingCsv(members), "text/csv;charset=utf-8");
  }

  return (
    <main className={pageClass}>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">{group.name}</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Greeting cards</h1>
          <p className="mt-3 max-w-xl text-stone-500">
            Verified mailing addresses, set as postal labels. {ready.length} {ready.length === 1 ? "address is" : "addresses are"} ready.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`} onClick={() => void copyAll()} disabled={ready.length === 0}>
            <Copy size={16} aria-hidden />
            Copy all formatted addresses
          </button>
          <button type="button" className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`} onClick={exportCsv} disabled={ready.length === 0}>
            <Download size={16} aria-hidden />
            Export CSV
          </button>
        </div>
      </header>

      <p className="mt-6 text-sm text-stone-500" role="status">
        {copyState === "copied" ? `Copied ${ready.length} formatted ${ready.length === 1 ? "address" : "addresses"}.` : null}
        {copyState === "failed" ? "Clipboard access was blocked. Select the addresses below and copy them manually." : null}
      </p>
      {copyState === "failed" ? (
        <textarea readOnly value={labels} aria-label="Formatted addresses" className="mt-3 min-h-40 w-full rounded-3xl border border-stone-200/60 bg-white p-6 text-sm shadow-warm" />
      ) : null}

      {ready.length === 0 ? (
        <p className={`${surfaceClass} mt-8 px-6 py-16 text-center font-display text-2xl font-bold tracking-tight`}>
          No verified mailing addresses yet.
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {ready.map((member) => (
            <li key={member.id}>
              <article className="h-full overflow-hidden rounded-3xl border border-stone-200/60 bg-white shadow-warm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
                <div className="h-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10" />
                <div className="p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <MemberAvatar firstName={member.firstName} lastName={member.lastName} photoUrl={member.photoUrl} />
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-bold tracking-tight">
                      <Link className="text-stone-850 underline decoration-transparent underline-offset-2 hover:decoration-amber-300" to={`/members/${encodeURIComponent(member.id)}`}>
                        {member.fullName}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">{member.relationship || "Family"}</p>
                  </div>
                </div>
                <p className="mt-5 whitespace-pre-line text-sm leading-6">
                  {member.address ? formatAddressBlock(member.address) : ""}
                </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {skipped.length > 0 ? (
        <p className="mt-10 text-sm text-stone-500">
          Not on this list:{" "}
          {skipped.map((member, index) => (
            <span key={member.id}>
              {index > 0 ? ", " : null}
              <Link className="font-semibold text-stone-850 underline decoration-amber-300 underline-offset-2" to={`/members/${encodeURIComponent(member.id)}`}>
                {member.fullName}
              </Link>
            </span>
          ))}
          . Mark an address verified on the profile to include it.
        </p>
      ) : null}
    </main>
  );
}
