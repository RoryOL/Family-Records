import { missingAddressParts } from "../lib/address";
import { nextBirthday } from "../lib/birthdays";
import { formatLongDate } from "../lib/dates";
import { isDeceased, yearsLived } from "../lib/members";
import type { Address } from "../types";

export interface AddressBadge {
  label: string;
  tone: "sage" | "gold" | "muted";
  place: string;
}

/** One or two letters for a person who has no picture yet. */
export function initialsFrom(firstName: string, lastName: string): string {
  const first = Array.from(firstName.trim())[0] ?? "";
  const last = Array.from(lastName.trim())[0] ?? "";
  const letters = `${first}${last}`.toLocaleUpperCase();
  return letters || "?";
}

export function nextBirthdayLabel(dateOfBirth: string | null, today = new Date()): string | null {
  if (!dateOfBirth) return null;
  const next = nextBirthday(dateOfBirth, today);
  if (!next) return null;
  const when = next.daysUntil === 0 ? "today" : next.daysUntil === 1 ? "tomorrow" : `in ${next.daysUntil} days`;
  return `Turns ${next.turningAge} ${when}`;
}

export function ageAtDeathLabel(dateOfBirth: string | null, dateOfDeath: string | null): string | null {
  const years = yearsLived(dateOfBirth, dateOfDeath);
  if (years === null) return null;
  if (years === 0) return "Died at less than a year";
  return `Died at ${years}`;
}

/** Birth year, or a birth–death span once the household has recorded a death. */
export function lifeYearLabel(member: { deceased: boolean; dateOfBirth: string | null; dateOfDeath: string | null }): string | null {
  const birth = member.dateOfBirth?.slice(0, 4) ?? "";
  if (!isDeceased(member)) return birth || null;
  const death = member.dateOfDeath?.slice(0, 4) ?? "";
  if (!birth && !death) return "Deceased";
  if (birth && death) return `${birth}–${death}`;
  if (birth) return `${birth}–`;
  return `–${death}`;
}

export function deathSummary(member: { deceased: boolean; dateOfBirth: string | null; dateOfDeath: string | null }): string | null {
  if (!isDeceased(member)) return null;
  if (!member.dateOfDeath) return "Deceased";
  const date = formatLongDate(member.dateOfDeath);
  const years = yearsLived(member.dateOfBirth, member.dateOfDeath);
  if (years === 0) return `Died ${date} at less than a year`;
  if (years != null && years > 0) return `Died ${date} at ${years}`;
  return `Died ${date}`;
}

export function isBirthdaySoon(dateOfBirth: string | null, withinDays = 7, today = new Date()): boolean {
  if (!dateOfBirth) return false;
  const next = nextBirthday(dateOfBirth, today);
  return next !== null && next.daysUntil <= withinDays;
}

export function addressBadge(address: Address | null): AddressBadge {
  if (!address) return { label: "No address", tone: "muted", place: "" };

  const missing = missingAddressParts(address);
  const place = [address.city, address.region]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  if (missing.length === 0) {
    return {
      label: address.verified ? "Verified" : "Unverified",
      tone: address.verified ? "sage" : "gold",
      place,
    };
  }

  return { label: "Incomplete", tone: "gold", place: address.line1.trim() || place };
}

export function badgeClass(tone: AddressBadge["tone"]): string {
  if (tone === "sage") return "bg-sage-soft text-sage";
  if (tone === "gold") return "bg-amber-100 text-amber-800";
  return "bg-stone-100 text-stone-500";
}
