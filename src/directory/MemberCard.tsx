import { Link } from "react-router";
import { formatLongDate } from "../lib/dates";
import { addressBadge, badgeClass, isBirthdaySoon, nextBirthdayLabel } from "./memberDisplay";
import type { Member } from "../types";

export function MemberCard({ member, to }: { member: Member; to: string }) {
  const soon = isBirthdaySoon(member.dateOfBirth);
  const next = nextBirthdayLabel(member.dateOfBirth);
  const badge = addressBadge(member.address);

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200/60 bg-white shadow-warm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta">
      {soon ? (
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-6 py-3 sm:px-8">
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">This week</span>
        </div>
      ) : null}
      <div className={`flex flex-1 flex-col px-6 pb-6 sm:px-8 sm:pb-8 ${soon ? "pt-5" : "pt-6 sm:pt-8"}`}>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          <Link to={to} className="after:absolute after:inset-0 focus-visible:outline-none">
            {member.fullName}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-stone-500">{member.relationship || "No relationship"}</p>
        <p className="mt-5 text-sm">{member.dateOfBirth ? formatLongDate(member.dateOfBirth) : "No birthday on file"}</p>
        {next ? <p className={`text-sm font-semibold ${soon ? "text-honey" : "text-stone-500"}`}>{next}</p> : null}
        <p className="mt-5 text-sm">{member.phone ?? "No phone"}</p>
        <p className="break-words text-sm">{member.email ?? "No email"}</p>
        <p className="mt-5 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(badge.tone)}`}>{badge.label}</span>
          {badge.place ? <span className="text-sm text-stone-500">{badge.place}</span> : null}
        </p>
      </div>
    </article>
  );
}
