import { describe, expect, it } from "vitest";
import type { MemberRelation } from "../types";
import { layoutFamilyTree, type TreePerson } from "./familyTree";

function person(id: string, dateOfBirth: string | null): TreePerson {
  return { id, dateOfBirth };
}

function link(from: string, to: string, kind: MemberRelation["kind"]): MemberRelation {
  const [fromMemberId, toMemberId] = kind === "parent" || from < to ? [from, to] : [to, from];
  return { id: `${kind}-${fromMemberId}-${toMemberId}`, familyGroupId: "grp", fromMemberId, toMemberId, kind, weddingDate: null };
}

function row(layout: ReturnType<typeof layoutFamilyTree>, generation: number): string[] {
  const component = layout.components[0];
  expect(component).toBeTruthy();
  return component!.rows.find((item) => item.generation === generation)!.people.map((item) => item.id);
}

describe("layoutFamilyTree", () => {
  const people = [
    person("arthur", "1956-12-18"),
    person("ruth", "1958-11-02"),
    person("marcus", "1986-09-23"),
    person("elena", "1988-04-12"),
    person("nora", "1991-01-19"),
    person("jonah", "2016-09-26"),
    person("willa", "2019-10-11"),
    person("chris", "2001-03-14"),
  ];
  const relations = [
    link("arthur", "ruth", "married"),
    link("arthur", "elena", "parent"),
    link("ruth", "elena", "parent"),
    link("arthur", "nora", "parent"),
    link("ruth", "nora", "parent"),
    link("elena", "marcus", "spouse"),
    link("elena", "jonah", "parent"),
    link("marcus", "jonah", "parent"),
    link("elena", "willa", "parent"),
    link("marcus", "willa", "parent"),
  ];

  it("stacks generations from the oldest row and keeps the eldest on the left", () => {
    const layout = layoutFamilyTree(people, relations);
    expect(layout.components).toHaveLength(1);
    expect(layout.components[0]!.rows.map((item) => item.generation)).toEqual([0, 1, 2]);
    expect(row(layout, 0)).toEqual(["arthur", "ruth"]);
    expect(row(layout, 1)).toEqual(["marcus", "elena", "nora"]);
    expect(row(layout, 2)).toEqual(["jonah", "willa"]);
    expect(layout.unlinkedIds).toEqual(["chris"]);
  });

  it("places an older sibling's family to the left of a younger sibling", () => {
    const reordered = people.map((item) => (item.id === "nora" ? person("nora", "1980-01-19") : item));
    const layout = layoutFamilyTree(reordered, relations);
    expect(row(layout, 1)).toEqual(["nora", "marcus", "elena"]);
  });

  it("puts a brother on the left of his sister when he is older, and his children on the next row", () => {
    const household = [person("cian", "1990-02-01"), person("aoife", "1994-05-01"), person("oisin", "2018-03-01"), person("saoirse", "2020-07-01")];
    const links = [link("aoife", "cian", "sibling"), link("cian", "oisin", "parent"), link("cian", "saoirse", "parent")];
    const layout = layoutFamilyTree(household, links);
    expect(layout.components[0]!.rows.map((item) => item.generation)).toEqual([0, 1]);
    expect(row(layout, 0)).toEqual(["cian", "aoife"]);
    expect(row(layout, 1)).toEqual(["oisin", "saoirse"]);
  });
});
