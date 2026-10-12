import { formatAddressBlock } from "../lib/address";
import { formatLongDate } from "../lib/dates";
import { MemberAvatar } from "./MemberAvatar";
import { addressBadge, badgeClass, nextBirthdayLabel } from "./memberDisplay";
import { labelClass } from "./styles";
import type { FamilyUser, Member } from "../types";

export function MemberProfile({ member, people }: { member: Member; people: readonly FamilyUser[] }) {
  const badge = addressBadge(member.address);
  const next = nextBirthdayLabel(member.dateOfBirth);
  const login = people.find((person) => person.id === member.linkedUserId);
  const address = member.address ? formatAddressBlock(member.address) : "";

  return (
    <div>
      <MemberAvatar firstName={member.firstName} lastName={member.lastName} photoUrl={member.photoUrl} size="lg" />
      <dl className="mt-6 grid gap-5">
      <div>
        <dt className={labelClass}>Relationship</dt>
        <dd className="mt-1 text-sm">{member.relationship || "—"}</dd>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <dt className={labelClass}>Date of birth</dt>
          <dd className="mt-1 text-sm">{member.dateOfBirth ? formatLongDate(member.dateOfBirth) : "—"}</dd>
        </div>
        <div>
          <dt className={labelClass}>Next birthday</dt>
          <dd className="mt-1 text-sm">{next ?? "No birthday on file"}</dd>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <dt className={labelClass}>Phone</dt>
          <dd className="mt-1 text-sm">
            {member.phone ? (
              <a className="underline decoration-amber-300 underline-offset-2" href={`tel:${member.phone.replace(/[^\d+]/g, "")}`}>
                {member.phone}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className={labelClass}>Email</dt>
          <dd className="mt-1 break-words text-sm">
            {member.email ? (
              <a className="underline decoration-amber-300 underline-offset-2" href={`mailto:${member.email}`}>
                {member.email}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </div>
      <div>
        <dt className={labelClass}>Postal address</dt>
        <dd className="mt-1 text-sm">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass(badge.tone)}`}>{badge.label}</span>
          {address ? <p className="mt-2 whitespace-pre-line leading-6">{address}</p> : <p className="mt-2 text-stone-500">No postal address</p>}
        </dd>
      </div>
      <div>
        <dt className={labelClass}>Notes</dt>
        <dd className="mt-1 whitespace-pre-line text-sm leading-6">{member.notes || "—"}</dd>
      </div>
      <div>
        <dt className={labelClass}>Login</dt>
        <dd className="mt-1 text-sm">{login ? `${login.email} · ${login.role === "owner" ? "Owner" : "Editor"}` : "No sign-in linked"}</dd>
      </div>
      </dl>
    </div>
  );
}
