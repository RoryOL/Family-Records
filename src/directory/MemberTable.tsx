import { Link, useNavigate } from "react-router";
import { formatLongDate } from "../lib/dates";
import { MemberAvatar } from "./MemberAvatar";
import { addressBadge, badgeClass, nextBirthdayLabel } from "./memberDisplay";
import type { Member } from "../types";

export function MemberTable({ members, hrefFor }: { members: readonly Member[]; hrefFor: (id: string) => string }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto rounded-3xl border border-stone-200/60 bg-white shadow-warm">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <caption className="sr-only">Family members</caption>
        <thead className="border-b border-stone-200/60 text-xs uppercase tracking-[0.14em] text-stone-500">
          <tr>
            <th scope="col" className="px-5 py-4 font-semibold">
              Name
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              Relationship
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              Birthday
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              Phone
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              Email
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
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
                className="cursor-pointer border-b border-stone-100 last:border-b-0 hover:bg-amber-50/40"
                onClick={() => navigate(href)}
              >
                <th scope="row" className="px-5 py-4 font-display text-base font-bold tracking-tight">
                  <span className="flex items-center gap-3">
                    <MemberAvatar firstName={member.firstName} lastName={member.lastName} photoUrl={member.photoUrl} size="sm" />
                    <Link to={href} className="underline-offset-2 hover:underline" onClick={(event) => event.stopPropagation()}>
                      {member.fullName}
                    </Link>
                  </span>
                </th>
                <td className="px-5 py-4">{member.relationship || "—"}</td>
                <td className="px-5 py-4">
                  <div>{member.dateOfBirth ? formatLongDate(member.dateOfBirth) : "—"}</div>
                  {next ? <div className="text-stone-500">{next}</div> : null}
                </td>
                <td className="px-5 py-4">{member.phone ?? "—"}</td>
                <td className="max-w-48 break-words px-5 py-4">{member.email ?? "—"}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass(badge.tone)}`}>{badge.label}</span>
                  {badge.place ? <div className="mt-1 text-stone-500">{badge.place}</div> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
