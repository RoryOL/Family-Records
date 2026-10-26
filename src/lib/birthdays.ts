import { parseIsoDate, toIsoDate } from "./dates";
import type { BirthdayWindow, Member, UpcomingBirthday } from "../types";

export function parseBirthdayWindow(value: string | null): BirthdayWindow {
  if (value === "7" || value === "30" || value === "90") return Number(value) as BirthdayWindow;
  return 30;
}

export function birthdayTiming(daysUntil: number): string {
  if (daysUntil === 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  return `in ${daysUntil} days`;
}

export interface NextBirthday {
  nextOccurrence: string;
  daysUntil: number;
  turningAge: number;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Birthday observed in `year`. Feb 29 is kept in leap years and
 * observed on Feb 28 in common years.
 */
function celebrationDate(year: number, month: number, day: number): Date {
  const maxDay = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(day, maxDay));
}

/** Next yearly occurrence of a calendar date, and how many years it marks. */
export function nextAnnual(isoDate: string, today = new Date()): { nextOccurrence: string; daysUntil: number; years: number } | null {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return null;

  const startToday = startOfDay(today);
  let next = celebrationDate(startToday.getFullYear(), parsed.month, parsed.day);
  if (next.getTime() < startToday.getTime()) {
    next = celebrationDate(startToday.getFullYear() + 1, parsed.month, parsed.day);
  }

  // Round so a 23- or 25-hour DST day still counts as one calendar day.
  const daysUntil = Math.round((next.getTime() - startToday.getTime()) / 86_400_000);

  return {
    nextOccurrence: toIsoDate(next),
    daysUntil,
    years: next.getFullYear() - parsed.year,
  };
}

export function nextBirthday(dateOfBirth: string, today = new Date()): NextBirthday | null {
  const next = nextAnnual(dateOfBirth, today);
  if (!next) return null;
  return { nextOccurrence: next.nextOccurrence, daysUntil: next.daysUntil, turningAge: next.years };
}

export function upcomingBirthdays(
  members: readonly Member[],
  withinDays: number,
  today = new Date(),
): UpcomingBirthday[] {
  const upcoming: UpcomingBirthday[] = [];

  for (const member of members) {
    if (!member.dateOfBirth) continue;
    const next = nextBirthday(member.dateOfBirth, today);
    if (!next || next.daysUntil > withinDays) continue;

    upcoming.push({
      memberId: member.id,
      fullName: member.fullName,
      relationship: member.relationship,
      dateOfBirth: member.dateOfBirth,
      nextOccurrence: next.nextOccurrence,
      daysUntil: next.daysUntil,
      turningAge: next.turningAge,
    });
  }

  upcoming.sort((a, b) => a.daysUntil - b.daysUntil || a.fullName.localeCompare(b.fullName));
  return upcoming;
}
