import { Link } from "react-router";
import { birthdayTiming, upcomingBirthdays } from "../lib/birthdays";
import { useFamily } from "../store/FamilyProvider";

export function BirthdayBanner({ onDismiss }: { onDismiss: () => void }) {
  const { members } = useFamily();
  const soon = upcomingBirthdays(members, 7);

  if (soon.length === 0) return null;

  return (
    <aside className="border-b border-line bg-gold-soft" aria-label="Birthday reminders">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Birthdays this week</p>
          <ul className="mt-1 space-y-1 text-sm">
            {soon.map((item) => (
              <li key={item.memberId}>
                <Link className="font-semibold text-ink underline decoration-line underline-offset-2" to={`/members/${encodeURIComponent(item.memberId)}`}>
                  {item.fullName}
                </Link>{" "}
                turns {item.turningAge} {birthdayTiming(item.daysUntil)}.
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="self-start text-sm font-semibold text-ink" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </aside>
  );
}
