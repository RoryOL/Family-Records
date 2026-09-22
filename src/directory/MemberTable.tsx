import { Link, useNavigate } from "react-router";
import { formatLongDate } from "../lib/dates";
import { addressBadge, badgeClass, nextBirthdayLabel } from "./memberDisplay";
import type { Member } from "../types";

export function MemberTable({ members, hrefFor }: { members: readonly Member[]; hrefFor: (id: string) => string }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-paper-2">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <caption className="sr-only">Family members</caption>
        <thead className="border-b border-line text-xs uppercase tracking-[0.14em] text-ink-soft">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Name
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Relationship
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Birthday
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Phone
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Email
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Address
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const href = hrefFor(member.id);
            const badge = addressBadge(member.address);
            const next = nextBirthdayLabel(member.dateOfBirth);
            return (
              <tr
                key={member.id}
                className="cursor-pointer border-b border-line last:border-b-0 hover:bg-paper"
                onClick={() => navigate(href)}
              >
                <th scope="row" className="px-4 py-3 font-display text-base font-bold">
                  <Link to={href} className="underline-offset-2 hover:underline" onClick={(event) => event.stopPropagation()}>
                    {member.fullName}
                  </Link>
                </th>
                <td className="px-4 py-3">{member.relationship || "—"}</td>
                <td className="px-4 py-3">
                  <div>{member.dateOfBirth ? formatLongDate(member.dateOfBirth) : "—"}</div>
                  {next ? <div className="text-ink-soft">{next}</div> : null}
                </td>
                <td className="px-4 py-3">{member.phone ?? "—"}</td>
                <td className="max-w-48 break-words px-4 py-3">{member.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass(badge.tone)}`}>{badge.label}</span>
                  {badge.place ? <div className="mt-1 text-ink-soft">{badge.place}</div> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
