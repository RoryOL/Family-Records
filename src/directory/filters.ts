import { matchesMemberQuery } from "../lib/members";
import type { Member } from "../types";

export type DirectoryView = "cards" | "table";

export function parseDirectoryView(value: string | null): DirectoryView {
  return value === "table" ? "table" : "cards";
}

export function listRelationships(members: readonly Member[]): string[] {
  return [...new Set(members.map((member) => member.relationship.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Name or relationship search, optionally narrowed to one relationship tag. */
export function filterMembers(members: readonly Member[], query: string, relationship: string): Member[] {
  const relationshipFilter = relationship.trim();

  return members
    .filter((member) => {
      if (relationshipFilter && member.relationship !== relationshipFilter) return false;
      return matchesMemberQuery(member, query);
    })
    .sort(
      (a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName) || a.id.localeCompare(b.id),
    );
}
