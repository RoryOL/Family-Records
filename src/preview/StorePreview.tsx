import { Cake, Mail, MapPin, Phone, Plus, RotateCcw, Users } from "lucide-react";
import type { ReactNode } from "react";
import { formatMailingLabel, missingAddressParts } from "../lib/address";
import { nextBirthday, upcomingBirthdays } from "../lib/birthdays";
import { addDays, formatLongDate, formatToday, toIsoDate } from "../lib/dates";
import { useFamily } from "../store/FamilyProvider";
import type { Address, FamilyUser, Member } from "../types";

export function StorePreview() {
  const { group, people, currentUser, members, addMember, removeMember, reset } = useFamily();
  const today = new Date();
  const soon = upcomingBirthdays(members, 7, today);
  const verifiedCount = members.filter((member) => member.address?.verified).length;

  function addSample() {
    const count = members.filter((member) => member.firstName === "Sample").length + 1;
    addMember({
      firstName: "Sample",
      lastName: `Relative ${count}`,
      relationship: "Friend",
      dateOfBirth: toIsoDate(addDays(today, 3)),
      phone: "(503) 555-0199",
      email: "sample.relative@example.com",
      address: null,
      notes: "Added from the local store preview.",
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Local mock data</p>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight sm:text-5xl">Kinfolk</h1>
          <p className="mt-2 max-w-xl text-lg text-ink-soft">{group.description}</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper-2 px-4 py-3 text-sm">
          <p className="font-serif text-xl">{group.name}</p>
          <p className="mt-1 text-ink-soft">
            Invite <code className="rounded bg-paper px-1.5 py-0.5 text-ink">{group.inviteCode}</code>
          </p>
          <ul className="mt-3 space-y-1">
            {people.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-4">
                <span>{person.displayName}</span>
                <span className="text-ink-soft">
                  {person.role}
                  {person.id === currentUser.id ? " · signed in" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-live="polite">
        <Stat icon={<Users size={18} aria-hidden />} label="People" value={String(members.length)} detail={group.name} />
        <Stat
          icon={<MapPin size={18} aria-hidden />}
          label="Verified addresses"
          value={String(verifiedCount)}
          detail="Ready for greeting-card mail"
        />
        <Stat
          icon={<Cake size={18} aria-hidden />}
          label="Birthdays in 7 days"
          value={String(soon.length)}
          detail={soon.length === 0 ? `None as of ${formatToday(today)}` : soon.map((item) => item.fullName).join(" · ")}
        />
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl font-medium">Household</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Profiles come from the in-memory family store. Reloading the page restores the mock household.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addSample}
              className="inline-flex items-center gap-2 rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-clay-deep"
            >
              <Plus size={16} aria-hidden />
              Add sample relative
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-2 px-4 py-2 text-sm font-semibold hover:border-ink"
            >
              <RotateCcw size={16} aria-hidden />
              Reset mock data
            </button>
          </div>
        </div>

        {members.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-line bg-paper-2 px-5 py-10 text-center text-ink-soft">
            No one is in this family yet. Add a sample relative, or reset the mock household.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4">
            {members.map((member) => (
              <li key={member.id}>
                <MemberCard member={member} people={people} today={today} onRemove={() => removeMember(member.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-line bg-paper-2 px-4 py-4">
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        {icon}
        <h3>{label}</h3>
      </div>
      <p className="mt-2 font-serif text-4xl font-medium">{value}</p>
      <p className="mt-1 text-sm leading-5 text-ink-soft">{detail}</p>
    </article>
  );
}

function MemberCard({
  member,
  people,
  today,
  onRemove,
}: {
  member: Member;
  people: FamilyUser[];
  today: Date;
  onRemove: () => void;
}) {
  const login = people.find((person) => person.id === member.linkedUserId);
  const status = addressStatus(member.address);
  const label = formatMailingLabel(member);

  return (
    <article className="rounded-2xl border border-line bg-paper-2 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl font-medium">{member.fullName}</h3>
          <p className="mt-1 text-sm text-ink-soft">{member.relationship}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full px-3 py-1 text-sm font-semibold text-ink-soft hover:bg-paper hover:text-ink"
        >
          Remove
        </button>
      </div>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="First name">{member.firstName}</Field>
        <Field label="Last name">{member.lastName}</Field>
        <Field label="Date of birth">{member.dateOfBirth ? formatLongDate(member.dateOfBirth) : "—"}</Field>
        <Field label="Next birthday">{birthdayPhrase(member, today)}</Field>
        <Field label="Phone">
          <span className="inline-flex items-center gap-2">
            <Phone size={14} aria-hidden className="text-ink-soft" />
            {member.phone ?? "—"}
          </span>
        </Field>
        <Field label="Email">
          <span className="inline-flex items-center gap-2">
            <Mail size={14} aria-hidden className="text-ink-soft" />
            {member.email ?? "—"}
          </span>
        </Field>
        <Field label="Postal address">
          <div className="flex flex-col gap-2">
            <span
              className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
                status.tone === "sage"
                  ? "bg-sage-soft text-sage"
                  : status.tone === "gold"
                    ? "bg-gold-soft text-gold"
                    : "bg-paper text-ink-soft"
              }`}
            >
              {status.label}
            </span>
            {label ? (
              <span className="whitespace-pre-line">{label}</span>
            ) : member.address ? (
              <span className="whitespace-pre-line text-ink-soft">
                {[member.address.line1, member.address.line2, member.address.city, member.address.region, member.address.postalCode, member.address.country]
                  .filter((part) => part.trim())
                  .join(", ") || "No postal lines yet"}
              </span>
            ) : (
              <span className="text-ink-soft">No postal address</span>
            )}
          </div>
        </Field>
        <Field label="Notes">{member.notes || "—"}</Field>
        <Field label="Login">
          {login ? `${login.email} · ${login.role}` : "No sign-in linked"}
        </Field>
      </dl>
    </article>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{label}</dt>
      <dd className="mt-1 text-sm leading-6">{children}</dd>
    </div>
  );
}

function birthdayPhrase(member: Member, today: Date): string {
  if (!member.dateOfBirth) return "No birthday on file";
  const next = nextBirthday(member.dateOfBirth, today);
  if (!next) return "Birthday needs a valid date";
  const when = next.daysUntil === 0 ? "today" : next.daysUntil === 1 ? "tomorrow" : `in ${next.daysUntil} days`;
  return `Turns ${next.turningAge} ${when}`;
}

function addressStatus(address: Address | null): { label: string; tone: "sage" | "gold" | "muted" } {
  if (!address) return { label: "No address", tone: "muted" };
  const missing = missingAddressParts(address);
  if (address.verified && missing.length === 0) return { label: "Verified", tone: "sage" };
  if (missing.length === 0) return { label: "Unverified", tone: "gold" };
  const detail = `missing ${missing.join(", ")}`;
  return { label: address.verified ? `Verified · ${detail}` : `Incomplete · ${detail}`, tone: "gold" };
}
