import { focusMemberId } from "../lib/kinship";
import { splitDisplayName } from "../lib/ownProfile";

/** The signed-in person's surname, from their profile, then from their account name. */
export function familySurname(
  members: readonly { id: string; lastName: string; linkedUserId: string | null }[],
  user: { id: string; displayName: string },
): string {
  const selfId = focusMemberId(members, user.id);
  const profileName = (selfId ? members.find((member) => member.id === selfId)?.lastName : "")?.trim() ?? "";
  if (profileName) return tidySurname(profileName);
  return tidySurname(splitDisplayName(user.displayName).lastName);
}

/**
 * Surnames a new person can take in one tap.
 * The signed-in person's surname is first. Other household surnames follow, most common first.
 */
export function surnameChoices(lastNames: readonly string[], familyName: string): string[] {
  const family = tidySurname(familyName);
  const familyKey = family.toLocaleLowerCase();
  const byKey = new Map<string, { name: string; count: number }>();

  for (const raw of lastNames) {
    const name = tidySurname(raw);
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
      if (key === familyKey) existing.name = family;
    } else {
      byKey.set(key, { name: key === familyKey ? family : name, count: 1 });
    }
  }

  if (family && !byKey.has(familyKey)) byKey.set(familyKey, { name: family, count: 0 });

  return [...byKey.values()]
    .sort((left, right) => {
      const leftFamily = left.name.toLocaleLowerCase() === familyKey ? 0 : 1;
      const rightFamily = right.name.toLocaleLowerCase() === familyKey ? 0 : 1;
      if (leftFamily !== rightFamily) return leftFamily - rightFamily;
      if (left.count !== right.count) return right.count - left.count;
      return left.name.localeCompare(right.name);
    })
    .map((item) => item.name);
}

function tidySurname(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
