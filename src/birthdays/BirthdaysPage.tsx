import { Download } from "lucide-react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { birthdayCalendar } from "../lib/calendar";
import { birthdayTiming, parseBirthdayWindow, upcomingBirthdays } from "../lib/birthdays";
import { formatLongDate, formatToday } from "../lib/dates";
import { downloadFile, fileSlug } from "../lib/download";
import { pageClass, secondaryButtonClass, surfaceClass } from "../directory/styles";
import { useFamily } from "../store/FamilyProvider";
import type { BirthdayWindow } from "../types";

const windows: BirthdayWindow[] = [7, 30, 90];

export function BirthdaysPage() {
  const { group, members } = useFamily();
  const [searchParams, setSearchParams] = useSearchParams();
  const within = parseBirthdayWindow(searchParams.get("within"));
  const upcoming = upcomingBirthdays(members, within);
  const undated = members.filter((member) => !member.dateOfBirth).sort((a, b) => a.fullName.localeCompare(b.fullName));

  useEffect(() => {
    document.title = `Birthdays · ${group.name} · Kinfolk`;
  }, [group.name]);

  function chooseWindow(window: BirthdayWindow) {
    const next = new URLSearchParams(searchParams);
    if (window === 30) next.delete("within");
    else next.set("within", String(window));
    setSearchParams(next, { replace: true });
  }

  function downloadCalendar() {
    downloadFile(
      `${fileSlug(group.name)}-birthdays.ics`,
      birthdayCalendar(members, `${group.name} birthdays`),
      "text/calendar;charset=utf-8",
    );
  }

  return (
    <main className={pageClass}>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">{group.name}</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Birthdays</h1>
          <p className="mt-3 max-w-xl text-stone-500">Upcoming dates as of {formatToday()}, with the age each person is turning.</p>
        </div>
        <button type="button" className={secondaryButtonClass} onClick={downloadCalendar}>
          <Download size={16} aria-hidden />
          Download calendar
        </button>
      </header>
      <p className="mt-6 text-sm text-stone-500">The .ics file repeats every year, so it can be imported into Google Calendar or Apple Calendar.</p>

      <div className="mt-8 flex flex-wrap gap-3" role="group" aria-label="Birthday window">
        {windows.map((window) => {
          const count = upcomingBirthdays(members, window).length;
          const selected = window === within;
          return (
            <button
              key={window}
              type="button"
              aria-pressed={selected}
              onClick={() => chooseWindow(window)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out ${
                selected ? "bg-terracotta text-white shadow-warm" : "border border-stone-200/60 bg-white text-stone-850 shadow-warm hover:-translate-y-0.5 hover:shadow-md"
              }`}
            >
              Next {window} days
              <span className={selected ? "opacity-80" : "text-stone-500"}> · {count}</span>
            </button>
          );
        })}
      </div>

      {upcoming.length === 0 ? (
        <p className={`${surfaceClass} mt-8 px-6 py-16 text-center font-display text-2xl font-bold tracking-tight`}>
          No birthdays in the next {within} days.
        </p>
      ) : (
        <ol className="mt-8 grid gap-6">
          {upcoming.map((item) => {
            const soon = item.daysUntil <= 7;
            return (
              <li key={item.memberId}>
                <Link
                  to={`/members/${encodeURIComponent(item.memberId)}`}
                  className={`flex flex-col gap-3 rounded-3xl border px-6 py-6 text-stone-850 no-underline shadow-warm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:px-8 ${
                    soon ? "border-amber-200/80 bg-gradient-to-r from-amber-500/10 to-orange-500/10" : "border-stone-200/60 bg-white"
                  }`}
                >
                  <span>
                    <span className="block font-display text-2xl font-bold tracking-tight">{item.fullName}</span>
                    <span className="mt-1 block text-sm text-stone-500">
                      {item.relationship || "Family"} · Turns {item.turningAge}
                    </span>
                  </span>
                  <span className={`text-sm font-semibold ${soon ? "text-honey" : "text-stone-500"}`}>
                    {formatLongDate(item.nextOccurrence)} · {birthdayTiming(item.daysUntil)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {undated.length > 0 ? (
        <p className="mt-10 text-sm text-stone-500">
          No birthday on file:{" "}
          {undated.map((member, index) => (
            <span key={member.id}>
              {index > 0 ? ", " : null}
              <Link className="font-semibold text-stone-850 underline decoration-amber-300 underline-offset-2" to={`/members/${encodeURIComponent(member.id)}`}>
                {member.fullName}
              </Link>
            </span>
          ))}
          .
        </p>
      ) : null}
    </main>
  );
}
