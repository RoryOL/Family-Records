import { parseIsoDate } from "./dates";
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

/** A yearly all-day calendar of family birthdays, using CRLF line endings. */
export function birthdayCalendar(members: readonly Member[], calendarName: string, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Family Records//Family birthdays//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
  ];

  for (const member of members) {
    if (!member.dateOfBirth || !parseIsoDate(member.dateOfBirth)) continue;
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

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
