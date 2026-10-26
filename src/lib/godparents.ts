import { isYoungerThan } from "./dates";
import type { Godparent } from "../types";

/** Dropdown value for a godparent who is not already in the household. */
export const FREE_NAME = "name";

export interface GodparentSlot {
  choice: string;
  name: string;
}

export interface NamedPerson {
  name: string;
  memberId: string | null;
}

export function emptyGodparentSlots(): [GodparentSlot, GodparentSlot] {
  return [
    { choice: "", name: "" },
    { choice: "", name: "" },
  ];
}

export function slotsFromGodparents(memberId: string, godparents: readonly Godparent[]): [GodparentSlot, GodparentSlot] {
  const slots = emptyGodparentSlots();
  for (const row of godparents) {
    if (row.memberId !== memberId || (row.slot !== 1 && row.slot !== 2)) continue;
    slots[row.slot - 1] = row.godparentMemberId
      ? { choice: row.godparentMemberId, name: "" }
      : { choice: FREE_NAME, name: row.godparentName };
  }
  return slots;
}

/** People who can be chosen as a godparent. Someone younger than the subject is left out, except a person already chosen. */
export function godparentOptions<T extends { id: string; dateOfBirth?: string | null }>(
  people: readonly T[],
  subjectDateOfBirth: string | null | undefined,
  selectedId = "",
): T[] {
  return people.filter((person) => person.id === selectedId || !isYoungerThan(person.dateOfBirth, subjectDateOfBirth));
}

/** Reject a blank typed name, a self link, the same person twice, or a godparent younger than this person. */
export function godparentProblem(
  slots: readonly GodparentSlot[],
  selfId?: string,
  people: readonly { id: string; dateOfBirth?: string | null }[] = [],
  subjectDateOfBirth?: string | null,
): string | null {
  const chosen = new Set<string>();
  for (const slot of slots) {
    if (!slot.choice) continue;
    if (slot.choice === FREE_NAME) {
      const name = slot.name.trim();
      if (!name) return "Enter the godparent's name.";
      if (name.length > 80) return "Keep a godparent's name under 80 characters.";
      const key = `name:${name.toLocaleLowerCase()}`;
      if (chosen.has(key)) return "Each godparent should be a different person.";
      chosen.add(key);
      continue;
    }
    if (selfId && slot.choice === selfId) return "A person cannot be their own godparent.";
    const person = people.find((item) => item.id === slot.choice);
    if (person && isYoungerThan(person.dateOfBirth, subjectDateOfBirth)) return "A godparent cannot be younger than this person.";
    if (chosen.has(slot.choice)) return "Each godparent should be a different person.";
    chosen.add(slot.choice);
  }
  return null;
}

export function godparentsFromSlots(
  familyGroupId: string,
  memberId: string,
  slots: readonly GodparentSlot[],
  people: readonly { id: string; fullName: string }[],
): Godparent[] {
  const rows: Godparent[] = [];
  slots.forEach((slot, index) => {
    if (!slot.choice) return;
    const person = slot.choice === FREE_NAME ? undefined : people.find((item) => item.id === slot.choice);
    if (slot.choice !== FREE_NAME && !person) return;
    const name = person ? person.fullName : slot.name.trim();
    if (!name) return;
    rows.push({
      id: globalThis.crypto?.randomUUID?.() ?? `god_${memberId}_${index + 1}`,
      familyGroupId,
      memberId,
      slot: (index + 1) as 1 | 2,
      godparentMemberId: person?.id ?? null,
      godparentName: name,
    });
  });
  return rows;
}

export function describedGodparents(
  memberId: string,
  godparents: readonly Godparent[],
  members: readonly { id: string; fullName: string }[],
): NamedPerson[] {
  return godparents
    .filter((row) => row.memberId === memberId)
    .sort((left, right) => left.slot - right.slot)
    .flatMap((row) => {
      const person = row.godparentMemberId ? members.find((member) => member.id === row.godparentMemberId) : undefined;
      const name = person?.fullName || row.godparentName.trim();
      if (!name) return [];
      return [{ name, memberId: person?.id ?? null }];
    });
}

export function describedGodchildren(
  memberId: string,
  godparents: readonly Godparent[],
  members: readonly { id: string; fullName: string }[],
): NamedPerson[] {
  return godparents
    .filter((row) => row.godparentMemberId === memberId)
    .flatMap((row) => {
      const child = members.find((member) => member.id === row.memberId);
      if (!child) return [];
      return [{ name: child.fullName, memberId: child.id }];
    })
    .sort((left, right) => left.name.localeCompare(right.name) || (left.memberId ?? "").localeCompare(right.memberId ?? ""));
}

export function replaceGodparentRows(existing: readonly Godparent[], memberId: string, next: readonly Godparent[]): Godparent[] {
  return [...existing.filter((row) => row.memberId !== memberId), ...next];
}

/** Drop rows for a removed person, and keep a typed name when that person was a godparent. */
export function detachGodparent(existing: readonly Godparent[], memberId: string): Godparent[] {
  return existing.flatMap((row) => {
    if (row.memberId === memberId) return [];
    if (row.godparentMemberId !== memberId) return [row];
    if (!row.godparentName.trim()) return [];
    return [{ ...row, godparentMemberId: null }];
  });
}
