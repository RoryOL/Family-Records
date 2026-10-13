import { effectiveParents, spouseGroups } from "./kinship";
import type { MemberRelation } from "../types";

export interface TreePerson {
  id: string;
  dateOfBirth: string | null;
}

export interface TreeRow {
  generation: number;
  people: { id: string; column: number }[];
}

export interface TreeConnector {
  parentIds: string[];
  childIds: string[];
}

export interface TreeComponent {
  columns: number;
  rows: TreeRow[];
  connectors: TreeConnector[];
}

export interface TreeLayout {
  components: TreeComponent[];
  unlinkedIds: string[];
}

/**
 * Generations run from the oldest row at the top to the youngest row at the bottom.
 * Within a generation the eldest person is in the left-most column.
 */
export function layoutFamilyTree(people: readonly TreePerson[], relations: readonly MemberRelation[]): TreeLayout {
  const ids = people.map((person) => person.id);
  const known = new Set(ids);
  const birth = new Map(people.map((person) => [person.id, person.dateOfBirth]));
  const parentsOf = effectiveParents(people, relations);
  const spousesOf = spouseGroups(people, relations);
  const components = connectedComponents(ids, parentsOf, spousesOf, relations);
  const linked = new Set(components.flat());

  const laid = components
    .map((component) => layoutComponent(component, parentsOf, spousesOf, birth))
    .sort((left, right) => compareBirth(oldestBirth(left.memberIds, birth), oldestBirth(right.memberIds, birth)) || left.memberIds[0]!.localeCompare(right.memberIds[0]!));

  return {
    components: laid.map(({ memberIds: _memberIds, ...component }) => component),
    unlinkedIds: ids.filter((id) => known.has(id) && !linked.has(id)).sort((left, right) => compareBirth(birth.get(left) ?? null, birth.get(right) ?? null) || left.localeCompare(right)),
  };
}

interface LaidComponent extends TreeComponent {
  memberIds: string[];
}

function layoutComponent(
  memberIds: string[],
  parentsOf: Map<string, string[]>,
  spousesOf: Map<string, string[]>,
  birth: Map<string, string | null>,
): LaidComponent {
  const memberSet = new Set(memberIds);
  const generations = assignGenerations(memberIds, parentsOf, spousesOf, memberSet);
  const units = coupleUnits(memberIds, spousesOf, birth);
  const preferred = new Map<string, string[] | null>();
  for (const unit of units) preferred.set(unitKey(unit), preferredParent(unit, units, parentsOf, memberSet, birth));

  const childrenOf = new Map<string, string[][]>();
  const roots: string[][] = [];
  for (const unit of units) {
    const parent = preferred.get(unitKey(unit));
    if (!parent) roots.push(unit);
    else {
      const key = unitKey(parent);
      const list = childrenOf.get(key) ?? [];
      list.push(unit);
      childrenOf.set(key, list);
    }
  }

  const column = new Map<string, number>();
  const place = (group: string[][], origin: number): number => {
    const ordered = [...group].sort((left, right) => compareUnits(left, right, birth, parentsOf));
    let cursor = origin;
    for (const unit of ordered) {
      const kids = [...(childrenOf.get(unitKey(unit)) ?? [])].sort((left, right) => compareChildUnits(left, right, new Set(unit), birth, parentsOf));
      const start = cursor;
      const childWidth = kids.length > 0 ? place(kids, cursor) : 0;
      const span = Math.max(unit.length, childWidth, 1);
      if (kids.length > 0 && childWidth < span) {
        const shiftBy = Math.floor((span - childWidth) / 2);
        for (const id of descendantIds(kids, childrenOf)) column.set(id, (column.get(id) ?? 0) + shiftBy);
      }
      const offset = start + Math.floor((span - unit.length) / 2);
      unit.forEach((id, index) => column.set(id, offset + index));
      cursor = start + span;
    }
    return cursor - origin;
  };

  const width = place(roots.sort((left, right) => compareUnits(left, right, birth, parentsOf)), 0);
  const generationNumbers = [...new Set(memberIds.map((id) => generations.get(id) ?? 0))].sort((left, right) => left - right);
  const rows: TreeRow[] = generationNumbers.map((generation) => ({
    generation,
    people: memberIds
      .filter((id) => (generations.get(id) ?? 0) === generation)
      .map((id) => ({ id, column: column.get(id) ?? 0 }))
      .sort((left, right) => left.column - right.column || compareBirth(birth.get(left.id) ?? null, birth.get(right.id) ?? null)),
  }));

  const connectors: TreeConnector[] = [];
  for (const unit of units) {
    const kids = childrenOf.get(unitKey(unit)) ?? [];
    const childIds = kids
      .flat()
      .filter((id) => (parentsOf.get(id) ?? []).some((parentId) => unit.includes(parentId)))
      .sort((left, right) => (column.get(left) ?? 0) - (column.get(right) ?? 0));
    if (childIds.length > 0) connectors.push({ parentIds: [...unit], childIds });
  }

  return { columns: Math.max(width, 1), rows, connectors, memberIds };
}

function assignGenerations(
  memberIds: readonly string[],
  parentsOf: Map<string, string[]>,
  spousesOf: Map<string, string[]>,
  memberSet: Set<string>,
): Map<string, number> {
  const generation = new Map(memberIds.map((id) => [id, 0]));
  for (let pass = 0; pass < memberIds.length + 2; pass += 1) {
    let changed = false;
    for (const id of memberIds) {
      for (const parentId of parentsOf.get(id) ?? []) {
        if (!memberSet.has(parentId)) continue;
        const next = (generation.get(parentId) ?? 0) + 1;
        if ((generation.get(id) ?? 0) < next) {
          generation.set(id, next);
          changed = true;
        }
      }
    }
    const level = (left: string, right: string) => {
      if (!memberSet.has(left) || !memberSet.has(right)) return;
      const shared = Math.max(generation.get(left) ?? 0, generation.get(right) ?? 0);
      if ((generation.get(left) ?? 0) !== shared) {
        generation.set(left, shared);
        changed = true;
      }
      if ((generation.get(right) ?? 0) !== shared) {
        generation.set(right, shared);
        changed = true;
      }
    };
    for (const id of memberIds) {
      for (const spouse of spousesOf.get(id) ?? []) level(id, spouse);
    }
    if (!changed) break;
  }
  const lowest = Math.min(...memberIds.map((id) => generation.get(id) ?? 0));
  if (lowest !== 0) {
    for (const id of memberIds) generation.set(id, (generation.get(id) ?? 0) - lowest);
  }
  return generation;
}

function coupleUnits(memberIds: readonly string[], spousesOf: Map<string, string[]>, birth: Map<string, string | null>): string[][] {
  const seen = new Set<string>();
  const units: string[][] = [];
  for (const id of memberIds) {
    if (seen.has(id)) continue;
    const unit: string[] = [];
    const queue = [id];
    seen.add(id);
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      unit.push(current);
      for (const spouse of spousesOf.get(current) ?? []) {
        if (seen.has(spouse) || !memberIds.includes(spouse)) continue;
        seen.add(spouse);
        queue.push(spouse);
      }
    }
    unit.sort((left, right) => compareBirth(birth.get(left) ?? null, birth.get(right) ?? null) || left.localeCompare(right));
    units.push(unit);
  }
  return units;
}

function preferredParent(
  unit: readonly string[],
  units: readonly string[][],
  parentsOf: Map<string, string[]>,
  memberSet: Set<string>,
  birth: Map<string, string | null>,
): string[] | null {
  const parentIds = new Set(unit.flatMap((id) => (parentsOf.get(id) ?? []).filter((parentId) => memberSet.has(parentId))));
  if (parentIds.size === 0) return null;
  const candidates = units.filter((candidate) => candidate !== unit && candidate.some((id) => parentIds.has(id)));
  if (candidates.length === 0) return null;
  const ranked = [...candidates].sort((left, right) => {
    const leftScore = left.filter((id) => parentIds.has(id)).length;
    const rightScore = right.filter((id) => parentIds.has(id)).length;
    if (leftScore !== rightScore) return rightScore - leftScore;
    return compareBirth(oldestBirth(left, birth), oldestBirth(right, birth));
  });
  return ranked[0] ?? null;
}

function descendantIds(units: readonly string[][], childrenOf: Map<string, string[][]>): string[] {
  const ids: string[] = [];
  const walk = (group: readonly string[][]) => {
    for (const unit of group) {
      ids.push(...unit);
      walk(childrenOf.get(unitKey(unit)) ?? []);
    }
  };
  walk(units);
  return ids;
}

function compareUnits(left: readonly string[], right: readonly string[], birth: Map<string, string | null>, parentsOf: Map<string, string[]>): number {
  return compareBirth(oldestBirth(anchorIds(left, parentsOf), birth), oldestBirth(anchorIds(right, parentsOf), birth)) || left.join().localeCompare(right.join());
}

function compareChildUnits(
  left: readonly string[],
  right: readonly string[],
  parentIds: Set<string>,
  birth: Map<string, string | null>,
  parentsOf: Map<string, string[]>,
): number {
  const leftAnchor = left.filter((id) => (parentsOf.get(id) ?? []).some((parentId) => parentIds.has(parentId)));
  const rightAnchor = right.filter((id) => (parentsOf.get(id) ?? []).some((parentId) => parentIds.has(parentId)));
  return compareBirth(oldestBirth(leftAnchor.length > 0 ? leftAnchor : left, birth), oldestBirth(rightAnchor.length > 0 ? rightAnchor : right, birth)) || left.join().localeCompare(right.join());
}

function anchorIds(unit: readonly string[], parentsOf: Map<string, string[]>): readonly string[] {
  const blood = unit.filter((id) => (parentsOf.get(id) ?? []).length > 0);
  return blood.length > 0 ? blood : unit;
}

function oldestBirth(ids: readonly string[], birth: Map<string, string | null>): string | null {
  const dates = ids.map((id) => birth.get(id) ?? null).filter((date): date is string => Boolean(date)).sort();
  return dates[0] ?? null;
}

function compareBirth(left: string | null, right: string | null): number {
  if (left && right) return left.localeCompare(right);
  if (left) return -1;
  if (right) return 1;
  return 0;
}

function unitKey(unit: readonly string[]): string {
  return [...unit].sort().join("|");
}

function connectedComponents(
  ids: readonly string[],
  parentsOf: Map<string, string[]>,
  spousesOf: Map<string, string[]>,
  relations: readonly MemberRelation[],
): string[][] {
  const parent = new Map(ids.map((id) => [id, id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root) ?? root;
    let cursor = id;
    while (cursor !== root) {
      const next = parent.get(cursor) ?? root;
      parent.set(cursor, root);
      cursor = next;
    }
    return root;
  };
  const union = (left: string, right: string) => {
    if (!parent.has(left) || !parent.has(right)) return;
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  };

  for (const id of ids) {
    for (const parentId of parentsOf.get(id) ?? []) union(id, parentId);
    for (const spouse of spousesOf.get(id) ?? []) union(id, spouse);
  }
  for (const relation of relations) {
    if (relation.kind === "sibling") union(relation.fromMemberId, relation.toMemberId);
  }

  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const root = find(id);
    const group = groups.get(root) ?? [];
    group.push(id);
    if (group.length === 1 && root === id && !hasLink(id, parentsOf, spousesOf, relations)) continue;
    groups.set(root, group);
  }
  return [...groups.values()].filter((group) => group.length > 1 || hasLink(group[0]!, parentsOf, spousesOf, relations));
}

function hasLink(id: string, parentsOf: Map<string, string[]>, spousesOf: Map<string, string[]>, relations: readonly MemberRelation[]): boolean {
  if ((parentsOf.get(id) ?? []).length > 0 || (spousesOf.get(id) ?? []).length > 0) return true;
  return relations.some((relation) => relation.kind !== "spouse" && (relation.fromMemberId === id || relation.toMemberId === id));
}
