import { Download } from "lucide-react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { birthdayCalendar } from "../lib/calendar";
import { birthdayTiming, parseBirthdayWindow, upcomingBirthdays } from "../lib/birthdays";
import { formatLongDate, formatToday } from "../lib/dates";
import { downloadFile, fileSlug } from "../lib/download";
import { secondaryButtonClass } from "../directory/styles";
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">{group.name}</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Birthdays</h1>
          <p className="mt-2 max-w-xl text-ink-soft">Upcoming dates as of {formatToday()}, with the age each person is turning.</p>
        </div>
        <button type="button" className={secondaryButtonClass} onClick={downloadCalendar}>
          <Download size={16} aria-hidden />
          Download calendar
        </button>
      </header>
      <p className="mt-4 text-sm text-ink-soft">The .ics file repeats every year, so it can be imported into Google Calendar or Apple Calendar.</p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Birthday window">
        {windows.map((window) => {
          const count = upcomingBirthdays(members, window).length;
          const selected = window === within;
          return (
            <button
              key={window}
              type="button"
              aria-pressed={selected}
              onClick={() => chooseWindow(window)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                selected ? "bg-blue text-white" : "border border-line bg-paper-2 text-ink hover:border-blue"
              }`}
            >
              Next {window} days
              <span className={selected ? "opacity-80" : "text-ink-soft"}> · {count}</span>
            </button>
          );
        })}
      </div>

      {upcoming.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-paper-2 px-5 py-12 text-center font-display text-2xl font-bold">
          No birthdays in the next {within} days.
        </p>
      ) : (
        <ol className="mt-6 grid gap-3">
          {upcoming.map((item) => {
            const soon = item.daysUntil <= 7;
            return (
              <li key={item.memberId}>
                <Link
                  to={`/members/${encodeURIComponent(item.memberId)}`}
                  className="flex flex-col gap-2 rounded-2xl border border-line bg-paper-2 px-5 py-4 text-ink no-underline hover:border-blue sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="block font-display text-2xl font-bold">{item.fullName}</span>
                    <span className="mt-1 block text-sm text-ink-soft">
                      {item.relationship || "Family"} · Turns {item.turningAge}
                    </span>
                  </span>
                  <span className={`text-sm font-semibold ${soon ? "text-blue" : "text-ink-soft"}`}>
                    {formatLongDate(item.nextOccurrence)} · {birthdayTiming(item.daysUntil)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {undated.length > 0 ? (
        <p className="mt-8 text-sm text-ink-soft">
          No birthday on file:{" "}
          {undated.map((member, index) => (
            <span key={member.id}>
              {index > 0 ? ", " : null}
              <Link className="font-semibold text-ink underline decoration-line underline-offset-2" to={`/members/${encodeURIComponent(member.id)}`}>
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
