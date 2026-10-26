import { Link } from "react-router";
import { MemberAvatar } from "../directory/MemberAvatar";
import { anniversaryPhrase, upcomingAnniversaries } from "../lib/anniversaries";
import { birthdayTiming, upcomingBirthdays } from "../lib/birthdays";
import { useFamily } from "../store/FamilyProvider";

export function BirthdayBanner({ onDismiss }: { onDismiss: () => void }) {
  const { members, relations } = useFamily();
  const soon = upcomingBirthdays(members, 7);
  const anniversaries = upcomingAnniversaries(members, relations, 7);

  if (soon.length === 0 && anniversaries.length === 0) return null;

  return (
    <aside className="border-b border-amber-200/70 bg-gradient-to-r from-amber-500/10 to-orange-500/10" aria-label="Birthday and anniversary reminders">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div className="grid gap-4">
          {soon.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Birthdays this week</p>
              <ul className="mt-2 space-y-1 text-sm">
                {soon.map((item) => {
                  const person = members.find((member) => member.id === item.memberId);
                  return (
                    <li key={item.memberId}>
                      <Link className="inline-flex items-center gap-2 font-semibold text-stone-850 underline decoration-amber-300 underline-offset-2" to={`/members/${encodeURIComponent(item.memberId)}`}>
                        {person ? <MemberAvatar firstName={person.firstName} lastName={person.lastName} photoUrl={person.photoUrl} size="sm" /> : null}
                        {item.fullName}
                      </Link>{" "}
                      turns {item.turningAge} {birthdayTiming(item.daysUntil)}.
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {anniversaries.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Anniversaries this week</p>
              <ul className="mt-2 space-y-1 text-sm">
                {anniversaries.map((item) => (
                  <li key={item.relationId}>
                    <CoupleNames leftId={item.leftId} rightId={item.rightId} label={item.label} members={members} /> {anniversaryPhrase(item.years)} {birthdayTiming(item.daysUntil)}.
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <button type="button" className="self-start rounded-full px-3 py-1.5 text-sm font-semibold text-stone-850 transition-all duration-200 ease-out hover:bg-white/70" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </aside>
  );
}

function CoupleNames({
  leftId,
  rightId,
  label,
  members,
}: {
  leftId: string;
  rightId: string;
  label: string;
  members: readonly { id: string; firstName: string; lastName: string; fullName: string; photoUrl: string | null }[];
}) {
  const [leftName, rightName] = label.split(" and ");
  const left = members.find((member) => member.id === leftId);
  const right = members.find((member) => member.id === rightId);
  return (
    <>
      <Link className="inline-flex items-center gap-2 font-semibold text-stone-850 underline decoration-amber-300 underline-offset-2" to={`/members/${encodeURIComponent(leftId)}`}>
        {left ? <MemberAvatar firstName={left.firstName} lastName={left.lastName} photoUrl={left.photoUrl} size="sm" /> : null}
        {leftName}
      </Link>{" "}
      and{" "}
      <Link className="font-semibold text-stone-850 underline decoration-amber-300 underline-offset-2" to={`/members/${encodeURIComponent(rightId)}`}>
        {right?.fullName ?? rightName}
      </Link>
    </>
  );
}
