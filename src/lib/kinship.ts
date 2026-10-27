import { parseIsoDate } from "./dates";
import type { Gender, MemberLinkInput, MemberRelation, RelationKind } from "../types";

export interface KinshipPerson {
  id: string;
  fullName: string;
  gender: Gender | null;
}

export interface KinshipLine {
  otherId: string;
  otherName: string;
  term: string;
  phrase: string;
  distance: number;
}

type Step = "parent" | "child" | "sibling" | "partner" | "married";

interface Edge {
  id: string;
  step: Step;
}

/** Drop a blank row and reject a duplicated or two-way parent link. */
export function linkProblem(links: readonly MemberLinkInput[]): string | null {
  const seen = new Set<string>();
  for (const link of links) {
    if (!link.otherId) return "Choose the person this relationship is with.";
    const key = `${link.role}:${link.otherId}`;
    if (seen.has(key)) return "That relationship is already listed.";
    seen.add(key);
    if (link.role === "married" && link.weddingDate?.trim() && !parseIsoDate(link.weddingDate.trim())) {
      return "Enter a real marriage date.";
    }
  }
  for (const link of links) {
    if (link.role === "parent" && links.some((other) => other.otherId === link.otherId && other.role === "child")) {
      return "Those two parent links point at each other.";
    }
    if (
      (link.role === "spouse" || link.role === "married") &&
      links.some((other) => other !== link && other.otherId === link.otherId && (other.role === "spouse" || other.role === "married"))
    ) {
      return "Record that pair as partner or married, not both.";
    }
  }
  return null;
}

export function linksTouching(memberId: string, relations: readonly MemberRelation[]): MemberLinkInput[] {
  const links: MemberLinkInput[] = [];
  for (const relation of relations) {
    if (relation.kind === "parent" && relation.fromMemberId === memberId) {
      links.push({ otherId: relation.toMemberId, role: "parent" });
    } else if (relation.kind === "parent" && relation.toMemberId === memberId) {
      links.push({ otherId: relation.fromMemberId, role: "child" });
    } else if ((relation.kind === "spouse" || relation.kind === "married") && (relation.fromMemberId === memberId || relation.toMemberId === memberId)) {
      const otherId = relation.fromMemberId === memberId ? relation.toMemberId : relation.fromMemberId;
      links.push(
        relation.kind === "married"
          ? { otherId, role: "married", weddingDate: relation.weddingDate ?? "" }
          : { otherId, role: "spouse" },
      );
    } else if (relation.kind === "sibling" && relation.fromMemberId === memberId) {
      links.push({ otherId: relation.toMemberId, role: "sibling" });
    } else if (relation.kind === "sibling" && relation.toMemberId === memberId) {
      links.push({ otherId: relation.fromMemberId, role: "sibling" });
    }
  }
  return links;
}

/** Replace every stored link that touches this person with the form rows. */
export function applyMemberLinks(
  relations: readonly MemberRelation[],
  familyGroupId: string,
  memberId: string,
  links: readonly MemberLinkInput[],
): MemberRelation[] {
  const kept = relations.filter((relation) => relation.fromMemberId !== memberId && relation.toMemberId !== memberId);
  const added = links.flatMap((link) => {
    const relation = relationFromLink(familyGroupId, memberId, link);
    return relation ? [relation] : [];
  });
  return dedupeRelations([...kept, ...added]);
}

export function relationFromLink(familyGroupId: string, memberId: string, link: MemberLinkInput): MemberRelation | null {
  if (!link.otherId || link.otherId === memberId) return null;
  if (link.role === "parent") return makeRelation(familyGroupId, memberId, link.otherId, "parent");
  if (link.role === "child") return makeRelation(familyGroupId, link.otherId, memberId, "parent");
  if (link.role === "sibling") return makeRelation(familyGroupId, memberId, link.otherId, "sibling");
  if (link.role === "spouse") return makeRelation(familyGroupId, memberId, link.otherId, "spouse");
  return makeRelation(familyGroupId, memberId, link.otherId, "married", link.weddingDate);
}

export function makeRelation(
  familyGroupId: string,
  fromMemberId: string,
  toMemberId: string,
  kind: RelationKind,
  weddingDate: string | null = null,
): MemberRelation | null {
  if (fromMemberId === toMemberId) return null;
  const [from, to] = kind === "parent" || fromMemberId < toMemberId ? [fromMemberId, toMemberId] : [toMemberId, fromMemberId];
  const date = kind === "married" && weddingDate && parseIsoDate(weddingDate.trim()) ? weddingDate.trim() : null;
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `rel_${from}_${to}_${kind}`,
    familyGroupId,
    fromMemberId: from,
    toMemberId: to,
    kind,
    weddingDate: date,
  };
}

export function dedupeRelations(relations: readonly MemberRelation[]): MemberRelation[] {
  const seen = new Map<string, MemberRelation>();
  for (const relation of relations) {
    const key = `${relation.kind}:${relation.fromMemberId}:${relation.toMemberId}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, relation);
      continue;
    }
    if (!existing.weddingDate && relation.weddingDate) seen.set(key, relation);
  }
  return [...seen.values()];
}

/**
 * How `subjectId` is related to `otherId`.
 * "Niece" means the subject is the niece of the other person.
 */
export function kinshipTerm(
  subjectId: string,
  otherId: string,
  people: readonly KinshipPerson[],
  relations: readonly MemberRelation[],
): string | null {
  return kinshipMatch(subjectId, otherId, people, relations)?.term ?? null;
}

/** Every named relationship this person has with someone else in the household, closest first. */
export function kinshipLines(subjectId: string, people: readonly KinshipPerson[], relations: readonly MemberRelation[]): KinshipLine[] {
  const lines: KinshipLine[] = [];
  for (const other of people) {
    if (other.id === subjectId) continue;
    const match = kinshipMatch(subjectId, other.id, people, relations);
    if (!match) continue;
    lines.push({
      otherId: other.id,
      otherName: other.fullName,
      term: match.term,
      phrase: `${match.term} of ${other.fullName}`,
      distance: match.distance,
    });
  }
  return lines.sort((a, b) => a.distance - b.distance || a.otherName.localeCompare(b.otherName) || a.otherId.localeCompare(b.otherId));
}

/**
 * Short label for a card. Prefers the relationship to the signed-in profile,
 * then the closest named link, then the free-text label.
 */
export function relationshipSummary(
  subject: KinshipPerson,
  people: readonly KinshipPerson[],
  relations: readonly MemberRelation[],
  focusId: string | null,
  fallback: string,
): string {
  if (focusId === subject.id) return fallback;
  if (focusId && focusId !== subject.id) {
    const term = kinshipTerm(subject.id, focusId, people, relations);
    if (term) return term;
  }
  const [closest] = kinshipLines(subject.id, people, relations);
  if (closest) return closest.phrase;
  return fallback;
}

export function focusMemberId(people: readonly { id: string; linkedUserId: string | null }[], currentUserId: string): string | null {
  return people.find((person) => person.linkedUserId === currentUserId)?.id ?? null;
}

interface FamilyModel {
  parentsOf: Map<string, string[]>;
  spousesOf: Map<string, string[]>;
  edges: Map<string, Edge[]>;
}

/** Parents used for the tree. A sibling with no parents of their own inherits the parents recorded on a sibling. */
export function effectiveParents(people: readonly { id: string }[], relations: readonly MemberRelation[]): Map<string, string[]> {
  return modelFamily(people, relations).parentsOf;
}

export function spouseGroups(people: readonly { id: string }[], relations: readonly MemberRelation[]): Map<string, string[]> {
  return modelFamily(people, relations).spousesOf;
}

function kinshipMatch(
  subjectId: string,
  otherId: string,
  people: readonly KinshipPerson[],
  relations: readonly MemberRelation[],
): { term: string; distance: number } | null {
  if (subjectId === otherId) return null;
  const known = new Set(people.map((person) => person.id));
  if (!known.has(subjectId) || !known.has(otherId)) return null;
  const steps = bestPath(otherId, subjectId, modelFamily(people, relations).edges);
  if (!steps) return null;
  const gender = people.find((person) => person.id === subjectId)?.gender ?? null;
  const term = labelForPath(steps, gender);
  if (!term) return null;
  return { term, distance: steps.length };
}

function modelFamily(people: readonly { id: string }[], relations: readonly MemberRelation[]): FamilyModel {
  const ids = people.map((person) => person.id);
  const known = new Set(ids);
  const recorded = new Map<string, Set<string>>(ids.map((id) => [id, new Set()]));
  const explicitSiblings: [string, string][] = [];
  const couplePairs: [string, string, "partner" | "married"][] = [];

  for (const relation of relations) {
    if (!known.has(relation.fromMemberId) || !known.has(relation.toMemberId)) continue;
    if (relation.fromMemberId === relation.toMemberId) continue;
    if (relation.kind === "parent") recorded.get(relation.toMemberId)?.add(relation.fromMemberId);
    else if (relation.kind === "sibling") explicitSiblings.push([relation.fromMemberId, relation.toMemberId]);
    else if (relation.kind === "spouse" || relation.kind === "married") {
      couplePairs.push([relation.fromMemberId, relation.toMemberId, relation.kind === "married" ? "married" : "partner"]);
    }
  }

  const parentOf = new Map(ids.map((id) => [id, id]));
  const find = (id: string): string => {
    let root = id;
    while (parentOf.get(root) !== root) root = parentOf.get(root) ?? root;
    let cursor = id;
    while (cursor !== root) {
      const next = parentOf.get(cursor) ?? root;
      parentOf.set(cursor, root);
      cursor = next;
    }
    return root;
  };
  const union = (left: string, right: string) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parentOf.set(rightRoot, leftRoot);
  };
  for (const [left, right] of explicitSiblings) union(left, right);

  const inherited = new Map<string, Set<string>>();
  for (const id of ids) {
    const root = find(id);
    const bucket = inherited.get(root) ?? new Set<string>();
    for (const parentId of recorded.get(id) ?? []) bucket.add(parentId);
    inherited.set(root, bucket);
  }

  const parentsOf = new Map<string, string[]>();
  for (const id of ids) {
    const own = recorded.get(id) ?? new Set<string>();
    const chosen = own.size > 0 ? own : (inherited.get(find(id)) ?? new Set<string>());
    parentsOf.set(
      id,
      [...chosen].filter((parentId) => parentId !== id && known.has(parentId)),
    );
  }

  const spousesOf = new Map<string, string[]>(ids.map((id) => [id, []]));
  const edges = new Map<string, Edge[]>(ids.map((id) => [id, []]));
  const add = (from: string, to: string, step: Step) => {
    if (from === to) return;
    const list = edges.get(from);
    if (!list || list.some((edge) => edge.id === to && edge.step === step)) return;
    list.push({ id: to, step });
  };

  const childrenByParent = new Map<string, string[]>();
  for (const [child, parents] of parentsOf) {
    for (const parentId of parents) {
      add(parentId, child, "child");
      add(child, parentId, "parent");
      const children = childrenByParent.get(parentId) ?? [];
      children.push(child);
      childrenByParent.set(parentId, children);
    }
  }
  for (const children of childrenByParent.values()) {
    for (let index = 0; index < children.length; index += 1) {
      for (let other = index + 1; other < children.length; other += 1) {
        add(children[index]!, children[other]!, "sibling");
        add(children[other]!, children[index]!, "sibling");
      }
    }
  }
  for (const [left, right] of explicitSiblings) {
    add(left, right, "sibling");
    add(right, left, "sibling");
  }
  for (const [left, right, step] of couplePairs) {
    add(left, right, step);
    add(right, left, step);
    spousesOf.get(left)?.push(right);
    spousesOf.get(right)?.push(left);
  }

  return { parentsOf, spousesOf, edges };
}

function bestPath(from: string, to: string, edges: Map<string, Edge[]>): Step[] | null {
  const queue: { id: string; steps: Step[]; cost: number }[] = [{ id: from, steps: [], cost: 0 }];
  const seen = new Map<string, number>([[from, 0]]);

  while (queue.length > 0) {
    queue.sort((left, right) => left.cost - right.cost);
    const current = queue.shift();
    if (!current || current.cost > (seen.get(current.id) ?? Infinity)) continue;
    if (current.id === to) return current.steps;
    if (current.steps.length >= 6) continue;

    for (const edge of edges.get(current.id) ?? []) {
      const steps = [...current.steps, edge.step];
      const couples = steps.filter((step) => step === "partner" || step === "married").length;
      const cost = steps.length * 10 + couples;
      const previous = seen.get(edge.id);
      if (previous !== undefined && previous <= cost) continue;
      seen.set(edge.id, cost);
      queue.push({ id: edge.id, steps, cost });
    }
  }
  return null;
}

function isCouple(step: Step | undefined): step is "partner" | "married" {
  return step === "partner" || step === "married";
}

function labelForPath(steps: readonly Step[], gender: Gender | null): string | null {
  if (steps.length === 0 || steps.some(isCouple)) return coupleLabel(steps, gender);
  return bloodLabel(steps, gender);
}

function bloodLabel(steps: readonly Step[], gender: Gender | null): string | null {
  if (steps.every((step) => step === "parent")) return ancestorLabel(steps.length, gender);
  if (steps.every((step) => step === "child")) return descendantLabel(steps.length, gender);
  if (steps.length === 1 && steps[0] === "sibling") return gendered(gender, "Sister", "Brother", "Sibling");

  if (steps[0] === "sibling" && steps.slice(1).every((step) => step === "child")) {
    const downs = steps.length - 1;
    const base = gendered(gender, "Niece", "Nephew", "Niece or nephew");
    return downs === 1 ? base : withGreats(downs - 1, base);
  }

  if (steps.at(-1) === "sibling" && steps.slice(0, -1).every((step) => step === "parent")) {
    const ups = steps.length - 1;
    const base = gendered(gender, "Aunt", "Uncle", "Aunt or uncle");
    return ups === 1 ? base : withGreats(ups - 1, base);
  }

  const siblingAt = steps.indexOf("sibling");
  if (
    siblingAt > 0 &&
    steps.indexOf("sibling", siblingAt + 1) === -1 &&
    steps.slice(0, siblingAt).every((step) => step === "parent") &&
    steps.slice(siblingAt + 1).every((step) => step === "child") &&
    steps.length > siblingAt + 1
  ) {
    return cousinLabel(siblingAt, steps.length - siblingAt - 1);
  }
  return null;
}

function coupleLabel(steps: readonly Step[], gender: Gender | null): string | null {
  if (steps.length === 1 && steps[0] === "partner") return "Partner";
  if (steps.length === 1 && steps[0] === "married") return gendered(gender, "Wife", "Husband", "Spouse");
  if (steps.length === 2 && steps[0] === "parent" && isCouple(steps[1])) return gendered(gender, "Stepmother", "Stepfather", "Stepparent");
  // A child of a partner or spouse is a son or daughter, including further descendants.
  if (isCouple(steps[0]) && steps.slice(1).every((step) => step === "child")) return descendantLabel(steps.length - 1, gender);

  if (steps[0] === "married") {
    const blood = bloodLabel(steps.slice(1), gender);
    return blood ? inLawOf(blood) : null;
  }
  if (steps.at(-1) === "married") {
    const blood = bloodLabel(steps.slice(0, -1), gender);
    return blood ? inLawOf(blood) : null;
  }
  return null;
}

function ancestorLabel(depth: number, gender: Gender | null): string {
  if (depth === 1) return gendered(gender, "Mother", "Father", "Parent");
  if (depth === 2) return gendered(gender, "Grandmother", "Grandfather", "Grandparent");
  return withGreats(depth - 2, gendered(gender, "Grandmother", "Grandfather", "Grandparent"));
}

function descendantLabel(depth: number, gender: Gender | null): string {
  if (depth === 1) return gendered(gender, "Daughter", "Son", "Child");
  if (depth === 2) return gendered(gender, "Granddaughter", "Grandson", "Grandchild");
  return withGreats(depth - 2, gendered(gender, "Granddaughter", "Grandson", "Grandchild"));
}

function cousinLabel(up: number, down: number): string {
  const degree = Math.min(up, down);
  const removed = Math.abs(up - down);
  const cousin = degree === 1 ? "Cousin" : `${ordinal(degree)} cousin`;
  if (removed === 0) return cousin;
  const times = removed === 1 ? "once" : removed === 2 ? "twice" : `${removed} times`;
  return `${cousin} ${times} removed`;
}

function inLawOf(term: string): string {
  const paired: Record<string, string> = {
    Mother: "Mother-in-law",
    Father: "Father-in-law",
    Parent: "Parent-in-law",
    Daughter: "Daughter-in-law",
    Son: "Son-in-law",
    Child: "Child-in-law",
    Sister: "Sister-in-law",
    Brother: "Brother-in-law",
    Sibling: "Sibling-in-law",
  };
  return paired[term] ?? `${term} by marriage`;
}

function withGreats(count: number, base: string): string {
  if (count <= 0) return base;
  return `${"Great-".repeat(count)}${base.charAt(0).toLowerCase()}${base.slice(1)}`;
}

function ordinal(value: number): string {
  const mod = value % 100;
  if (mod >= 11 && mod <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function gendered(gender: Gender | null, female: string, male: string, neutral: string): string {
  if (gender === "female") return female;
  if (gender === "male") return male;
  return neutral;
}

