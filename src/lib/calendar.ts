import { parseIsoDate } from "./dates";
import { isDeceased } from "./members";
import type { Member } from "../types";

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function formatUtcStamp(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export interface CalendarEvent {
  id: string;
  date: string;
  summary: string;
  description: string;
}

/** A yearly all-day calendar of family birthdays, using CRLF line endings. */
export function birthdayCalendar(members: readonly Member[], calendarName: string, now = new Date(), extra: readonly CalendarEvent[] = []): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Family Records//Family birthdays//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
  ];

  for (const member of members) {
    if (isDeceased(member) || !member.dateOfBirth || !parseIsoDate(member.dateOfBirth)) continue;
    const summary = `${member.fullName}'s birthday`;
    const relationship = member.relationship.trim() || "family";
    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsEscape(member.id)}@familyrecords`,
      `DTSTAMP:${formatUtcStamp(now)}`,
      `DTSTART;VALUE=DATE:${member.dateOfBirth.replaceAll("-", "")}`,
      "RRULE:FREQ=YEARLY",
      `SUMMARY:${icsEscape(summary)}`,
      `DESCRIPTION:${icsEscape(`${member.fullName} (${relationship})`)}`,
      "END:VEVENT",
    );
  }

  for (const event of extra) {
    if (!parseIsoDate(event.date)) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsEscape(event.id)}@familyrecords`,
      `DTSTAMP:${formatUtcStamp(now)}`,
      `DTSTART;VALUE=DATE:${event.date.replaceAll("-", "")}`,
      "RRULE:FREQ=YEARLY",
      `SUMMARY:${icsEscape(event.summary)}`,
      `DESCRIPTION:${icsEscape(event.description)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
