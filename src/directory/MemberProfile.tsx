import { Link } from "react-router";
import { formatAddressBlock } from "../lib/address";
import { eircodeSummary, lookupEircode } from "../lib/eircode";
import { weddingWith } from "../lib/anniversaries";
import { describedGodchildren, describedGodparents, type NamedPerson } from "../lib/godparents";
import { formatLongDate } from "../lib/dates";
import type { KinshipLine } from "../lib/kinship";
import { MemberAvatar } from "./MemberAvatar";
import { memberPath } from "./paths";
import { isDeceased } from "../lib/members";
import { addressBadge, ageAtDeathLabel, badgeClass, nextBirthdayLabel } from "./memberDisplay";
import { labelClass } from "./styles";
import type { FamilyUser, Godparent, Member, MemberRelation } from "../types";

export function MemberProfile({
  member,
  people,
  lines = [],
  relations = [],
  godparents = [],
  household = [],
}: {
  member: Member;
  people: readonly FamilyUser[];
  lines?: readonly KinshipLine[];
  relations?: readonly MemberRelation[];
  godparents?: readonly Godparent[];
  household?: readonly Member[];
}) {
  const badge = addressBadge(member.address);
  const remembered = isDeceased(member);
  const next = remembered ? null : nextBirthdayLabel(member.dateOfBirth);
  const age = remembered ? ageAtDeathLabel(member.dateOfBirth, member.dateOfDeath) : null;
  const login = people.find((person) => person.id === member.linkedUserId);
  const address = member.address ? formatAddressBlock(member.address) : "";
  const eircode = member.address?.format === "ie" ? lookupEircode(member.address.postalCode) : null;
  const names = household.map((person) => ({ id: person.id, fullName: person.fullName }));
  const sponsors = describedGodparents(member.id, godparents, names);
  const godchildren = describedGodchildren(member.id, godparents, names);
  const weddings = lines.flatMap((line) => {
    const date = weddingWith(member.id, line.otherId, relations);
    return date ? [{ otherId: line.otherId, otherName: line.otherName, date }] : [];
  });

  return (
    <div>
      <MemberAvatar firstName={member.firstName} lastName={member.lastName} photoUrl={member.photoUrl} size="lg" />
      {remembered ? <p className="mt-4 text-sm font-semibold text-stone-600">Deceased</p> : null}
      <dl className="mt-6 grid gap-5">
      <div>
        <dt className={labelClass}>Relationships</dt>
        <dd className="mt-1 text-sm">
          {lines.length > 0 ? (
            <ul className="grid gap-1">
              {lines.map((line) => (
                <li key={`${line.otherId}-${line.term}`}>
                  <Link className="underline decoration-amber-300 underline-offset-2" to={memberPath(line.otherId)}>
                    {line.phrase}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            member.relationship || "—"
          )}
          {lines.length > 0 && member.relationship && !lines.some((line) => line.term === member.relationship) ? (
            <p className="mt-2 text-stone-500">Label: {member.relationship}</p>
          ) : null}
          {weddings.length > 0 ? (
            <ul className="mt-2 grid gap-1">
              {weddings.map((wedding) => (
                <li key={wedding.otherId}>
                  Married to{" "}
                  <Link className="underline decoration-amber-300 underline-offset-2" to={memberPath(wedding.otherId)}>
                    {wedding.otherName}
                  </Link>{" "}
                  on {formatLongDate(wedding.date)}
                </li>
              ))}
            </ul>
          ) : null}
        </dd>
      </div>
      <PersonList title="Godparents" people={sponsors} empty="No godparents on file" />
      <PersonList title="Godchildren" people={godchildren} empty="No godchildren on file" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <dt className={labelClass}>Date of birth</dt>
          <dd className="mt-1 text-sm">{member.dateOfBirth ? formatLongDate(member.dateOfBirth) : "—"}</dd>
        </div>
        <div>
          <dt className={labelClass}>{remembered ? "Date of death" : "Next birthday"}</dt>
          <dd className="mt-1 text-sm">
            {remembered ? (member.dateOfDeath ? formatLongDate(member.dateOfDeath) : "Date not recorded") : (next ?? "No birthday on file")}
          </dd>
          {age ? <p className="mt-1 text-sm text-stone-500">{age}</p> : null}
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
          {eircode ? <p className="mt-2 text-sm text-stone-500">{eircodeSummary(eircode)}</p> : null}
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

function PersonList({ title, people, empty }: { title: string; people: readonly NamedPerson[]; empty: string }) {
  return (
    <div>
      <dt className={labelClass}>{title}</dt>
      <dd className="mt-1 text-sm">
        {people.length === 0 ? (
          empty
        ) : (
          <ul className="grid gap-1">
            {people.map((person) => (
              <li key={`${person.memberId ?? "name"}-${person.name}`}>
                {person.memberId ? (
                  <Link className="underline decoration-amber-300 underline-offset-2" to={memberPath(person.memberId)}>
                    {person.name}
                  </Link>
                ) : (
                  person.name
                )}
              </li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}
