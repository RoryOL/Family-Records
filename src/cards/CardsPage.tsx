import { Copy, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { primaryButtonClass, secondaryButtonClass } from "../directory/styles";
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
    document.title = `Greeting cards · ${group.name} · Kinfolk`;
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-6 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">{group.name}</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Greeting cards</h1>
          <p className="mt-2 max-w-xl text-ink-soft">
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

      <p className="mt-4 text-sm text-ink-soft" role="status">
        {copyState === "copied" ? `Copied ${ready.length} formatted ${ready.length === 1 ? "address" : "addresses"}.` : null}
        {copyState === "failed" ? "Clipboard access was blocked. Select the addresses below and copy them manually." : null}
      </p>
      {copyState === "failed" ? (
        <textarea readOnly value={labels} aria-label="Formatted addresses" className="mt-3 min-h-40 w-full rounded-2xl border border-line bg-white p-4 text-sm" />
      ) : null}

      {ready.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-paper-2 px-5 py-12 text-center font-display text-2xl font-bold">
          No verified mailing addresses yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ready.map((member) => (
            <li key={member.id}>
              <article className="h-full rounded-2xl border border-line bg-paper-2 p-5 shadow-[inset_0_0_0_1px_var(--color-line)]">
                <h2 className="font-display text-xl font-bold">
                  <Link className="text-ink underline decoration-transparent underline-offset-2 hover:decoration-line" to={`/members/${encodeURIComponent(member.id)}`}>
                    {member.fullName}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-ink-soft">{member.relationship || "Family"}</p>
                <p className="mt-4 whitespace-pre-line text-sm leading-6">
                  {member.address ? formatAddressBlock(member.address) : ""}
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}

      {skipped.length > 0 ? (
        <p className="mt-8 text-sm text-ink-soft">
          Not on this list:{" "}
          {skipped.map((member, index) => (
            <span key={member.id}>
              {index > 0 ? ", " : null}
              <Link className="font-semibold text-ink underline decoration-line underline-offset-2" to={`/members/${encodeURIComponent(member.id)}`}>
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
