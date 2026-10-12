import { missingAddressParts } from "../lib/address";
import { nextBirthday } from "../lib/birthdays";
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
