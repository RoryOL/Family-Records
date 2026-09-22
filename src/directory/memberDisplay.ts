import { missingAddressParts } from "../lib/address";
import { nextBirthday } from "../lib/birthdays";
import type { Address } from "../types";

export interface AddressBadge {
  label: string;
  tone: "sage" | "gold" | "muted";
  place: string;
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
  if (tone === "sage") return "bg-blue text-white";
  if (tone === "gold") return "bg-blue-soft text-blue";
  return "bg-paper text-ink-soft";
}
