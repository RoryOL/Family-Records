import { nextAnnual } from "./birthdays";
import type { IsoDate, Member, MemberRelation } from "../types";

export interface UpcomingAnniversary {
  relationId: string;
  leftId: string;
  rightId: string;
  label: string;
  weddingDate: IsoDate;
  nextOccurrence: IsoDate;
  daysUntil: number;
  years: number;
}

export function anniversaryPhrase(years: number): string {
  if (years <= 0) return "celebrate their wedding day";
  return `celebrate their ${ordinal(years)} anniversary`;
}

export function upcomingAnniversaries(
  members: readonly Member[],
  relations: readonly MemberRelation[],
  withinDays: number,
  today = new Date(),
): UpcomingAnniversary[] {
  const byId = new Map(members.map((member) => [member.id, member]));
  const upcoming: UpcomingAnniversary[] = [];

  for (const relation of relations) {
    if (relation.kind !== "married" || !relation.weddingDate) continue;
    const left = byId.get(relation.fromMemberId);
    const right = byId.get(relation.toMemberId);
    if (!left || !right) continue;
    const next = nextAnnual(relation.weddingDate, today);
    if (!next || next.daysUntil > withinDays) continue;
    const [first, second] = orderCouple(left, right);
    upcoming.push({
      relationId: relation.id,
      leftId: first.id,
      rightId: second.id,
      label: `${first.fullName} and ${second.fullName}`,
      weddingDate: relation.weddingDate,
      nextOccurrence: next.nextOccurrence,
      daysUntil: next.daysUntil,
      years: next.years,
    });
  }

  upcoming.sort((left, right) => left.daysUntil - right.daysUntil || left.label.localeCompare(right.label));
  return upcoming;
}

export function weddingsWithoutDates(members: readonly Member[], relations: readonly MemberRelation[]): { relationId: string; label: string }[] {
  const byId = new Map(members.map((member) => [member.id, member]));
  return relations
    .filter((relation) => relation.kind === "married" && !relation.weddingDate)
    .flatMap((relation) => {
      const left = byId.get(relation.fromMemberId);
      const right = byId.get(relation.toMemberId);
      if (!left || !right) return [];
      const [first, second] = orderCouple(left, right);
      return [{ relationId: relation.id, label: `${first.fullName} and ${second.fullName}` }];
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function weddingWith(memberId: string, otherId: string, relations: readonly MemberRelation[]): IsoDate | null {
  const relation = relations.find(
    (item) =>
      item.kind === "married" &&
      ((item.fromMemberId === memberId && item.toMemberId === otherId) || (item.fromMemberId === otherId && item.toMemberId === memberId)),
  );
  return relation?.weddingDate ?? null;
}

function orderCouple(left: Member, right: Member): [Member, Member] {
  if (left.dateOfBirth && right.dateOfBirth && left.dateOfBirth !== right.dateOfBirth) {
    return left.dateOfBirth < right.dateOfBirth ? [left, right] : [right, left];
  }
  return left.fullName.localeCompare(right.fullName) <= 0 ? [left, right] : [right, left];
}

function ordinal(value: number): string {
  const mod = value % 100;
  if (mod >= 11 && mod <= 13) return `${value}th`;
  const last = value % 10;
  if (last === 1) return `${value}st`;
  if (last === 2) return `${value}nd`;
  if (last === 3) return `${value}rd`;
  return `${value}th`;
}
