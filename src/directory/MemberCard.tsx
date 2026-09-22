import { Link } from "react-router";
import { formatLongDate } from "../lib/dates";
import { addressBadge, badgeClass, isBirthdaySoon, nextBirthdayLabel } from "./memberDisplay";
import type { Member } from "../types";

export function MemberCard({ member, to }: { member: Member; to: string }) {
  const soon = isBirthdaySoon(member.dateOfBirth);
  const next = nextBirthdayLabel(member.dateOfBirth);
  const badge = addressBadge(member.address);

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border border-line bg-paper-2 p-5 hover:border-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-clay ${
        soon ? "shadow-[inset_3px_0_0_var(--color-clay)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-serif text-2xl font-medium leading-tight">
          <Link to={to} className="after:absolute after:inset-0 focus-visible:outline-none">
            {member.fullName}
          </Link>
        </h2>
        {soon ? <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-clay">This week</span> : null}
      </div>
      <p className="mt-1 text-sm text-ink-soft">{member.relationship || "No relationship"}</p>
      <p className="mt-4 text-sm">{member.dateOfBirth ? formatLongDate(member.dateOfBirth) : "No birthday on file"}</p>
      {next ? <p className={`text-sm ${soon ? "text-clay" : "text-ink-soft"}`}>{next}</p> : null}
      <p className="mt-4 text-sm">{member.phone ?? "No phone"}</p>
      <p className="break-words text-sm">{member.email ?? "No email"}</p>
      <p className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass(badge.tone)}`}>{badge.label}</span>
        {badge.place ? <span className="text-sm text-ink-soft">{badge.place}</span> : null}
      </p>
    </article>
  );
}
