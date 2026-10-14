import { matchesMemberQuery } from "../lib/members";
import type { Member } from "../types";

export type DirectoryView = "cards" | "table";

export function parseDirectoryView(value: string | null): DirectoryView {
  return value === "table" ? "table" : "cards";
}

export function listRelationships(members: readonly Member[], labels?: ReadonlyMap<string, string>): string[] {
  return [...new Set(members.map((member) => (labels?.get(member.id) ?? member.relationship).trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Name or relationship search, optionally narrowed to one relationship tag. */
export function filterMembers(members: readonly Member[], query: string, relationship: string, labels?: ReadonlyMap<string, string>): Member[] {
  const relationshipFilter = relationship.trim();
  const needle = query.trim().toLowerCase();

  return members
    .filter((member) => {
      const label = labels?.get(member.id) ?? member.relationship;
      if (relationshipFilter && label !== relationshipFilter) return false;
      if (!needle) return true;
      return matchesMemberQuery(member, query) || label.toLowerCase().includes(needle);
    })
    .sort(
      (a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName) || a.id.localeCompare(b.id),
    );
}
