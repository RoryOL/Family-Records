import { describe, expect, it } from "vitest";
import type { Gender, MemberRelation } from "../types";
import { applyMemberLinks, kinshipLines, kinshipTerm, linkProblem, linksTouching, relationshipSummary } from "./kinship";

interface Person {
  id: string;
  fullName: string;
  gender: Gender | null;
}

function person(id: string, fullName: string, gender: Gender | null = null): Person {
  return { id, fullName, gender };
}

function link(from: string, to: string, kind: MemberRelation["kind"]): MemberRelation {
  const [fromMemberId, toMemberId] = kind === "parent" || from < to ? [from, to] : [to, from];
  return { id: `${kind}-${fromMemberId}-${toMemberId}`, familyGroupId: "grp", fromMemberId, toMemberId, kind };
}

const aoife = person("aoife", "Aoife", "female");
const cian = person("cian", "Cian", "male");
const saoirse = person("saoirse", "Saoirse", "female");
const oisin = person("oisin", "Oisín", "male");
const nuala = person("nuala", "Nuala");

describe("kinship", () => {
  const brother = [link("aoife", "cian", "sibling"), link("cian", "saoirse", "parent"), link("cian", "oisin", "parent")];
  const people = [aoife, cian, saoirse, oisin, nuala];

  it("names a brother and that brother's children as niece and nephew", () => {
    expect(kinshipTerm("cian", "aoife", people, brother)).toBe("Brother");
    expect(kinshipTerm("aoife", "cian", people, brother)).toBe("Sister");
    expect(kinshipTerm("saoirse", "aoife", people, brother)).toBe("Niece");
    expect(kinshipTerm("oisin", "aoife", people, brother)).toBe("Nephew");
    expect(kinshipTerm("saoirse", "cian", people, brother)).toBe("Daughter");
    expect(kinshipTerm("oisin", "cian", people, brother)).toBe("Son");
    expect(kinshipTerm("nuala", "aoife", people, brother)).toBeNull();
  });

  it("uses a neutral term when gender is not recorded", () => {
    const unnamed = [person("aoife", "Aoife"), person("cian", "Cian"), person("child", "Child")];
    const relations = [link("aoife", "cian", "sibling"), link("cian", "child", "parent")];
    expect(kinshipTerm("cian", "aoife", unnamed, relations)).toBe("Sibling");
    expect(kinshipTerm("child", "aoife", unnamed, relations)).toBe("Niece or nephew");
  });

  it("lists every named relationship, closest first", () => {
    expect(kinshipLines("saoirse", people, brother).map((line) => line.phrase)).toEqual([
      "Daughter of Cian",
      "Sister of Oisín",
      "Niece of Aoife",
    ]);
  });

  it("prefers the relationship to the signed-in person on a card", () => {
    expect(relationshipSummary(saoirse, people, brother, "aoife", "Cousin")).toBe("Niece");
    expect(relationshipSummary(aoife, people, brother, "aoife", "Self")).toBe("Self");
    expect(relationshipSummary(nuala, people, brother, "aoife", "Friend")).toBe("Friend");
  });

  it("names parents, grandparents, cousins, and partners", () => {
    const family = [
      person("gran", "Gran", "female"),
      person("pat", "Pat", "male"),
      person("mary", "Mary", "female"),
      person("aoife", "Aoife", "female"),
      person("cian", "Cian", "male"),
      person("cousin", "Sam", "male"),
      person("partner", "Alex", "male"),
    ];
    const relations = [
      link("gran", "pat", "parent"),
      link("gran", "uncle", "parent"),
      link("pat", "mary", "spouse"),
      link("pat", "aoife", "parent"),
      link("mary", "aoife", "parent"),
      link("uncle", "cousin", "parent"),
      link("aoife", "partner", "spouse"),
    ];
    const named = [...family, person("uncle", "Uncle", "male")];
    expect(kinshipTerm("mary", "aoife", named, relations)).toBe("Mother");
    expect(kinshipTerm("pat", "aoife", named, relations)).toBe("Father");
    expect(kinshipTerm("gran", "aoife", named, relations)).toBe("Grandmother");
    expect(kinshipTerm("aoife", "mary", named, relations)).toBe("Daughter");
    expect(kinshipTerm("uncle", "aoife", named, relations)).toBe("Uncle");
    expect(kinshipTerm("cousin", "aoife", named, relations)).toBe("Cousin");
    expect(kinshipTerm("partner", "aoife", named, relations)).toBe("Husband");
    expect(kinshipTerm("partner", "mary", named, relations)).toBe("Son-in-law");
  });

  it("treats siblings who share a parent as brothers even without an extra sibling link", () => {
    const family = [person("aoife", "Aoife", "female"), person("cian", "Cian", "male"), person("pat", "Pat", "male")];
    const relations = [link("pat", "aoife", "parent"), link("pat", "cian", "parent")];
    expect(kinshipTerm("cian", "aoife", family, relations)).toBe("Brother");
  });
});

describe("member links", () => {
  it("turns a sibling row into one stored link and reads it back from either person", () => {
    const stored = applyMemberLinks([], "grp", "aoife", [{ otherId: "cian", role: "sibling" }]);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ kind: "sibling" });
    expect(linksTouching("cian", stored)).toEqual([{ otherId: "aoife", role: "sibling" }]);
    expect(linksTouching("aoife", stored)).toEqual([{ otherId: "cian", role: "sibling" }]);
  });

  it("stores a child as a parent link pointing at this person", () => {
    const stored = applyMemberLinks([], "grp", "saoirse", [{ otherId: "cian", role: "child" }]);
    expect(stored[0]).toMatchObject({ fromMemberId: "cian", toMemberId: "saoirse", kind: "parent" });
  });

  it("rejects a blank person, a duplicate, and parent links that point both ways", () => {
    expect(linkProblem([{ otherId: "", role: "sibling" }])).toBe("Choose the person this relationship is with.");
    expect(linkProblem([{ otherId: "cian", role: "sibling" }, { otherId: "cian", role: "sibling" }])).toBe("That relationship is already listed.");
    expect(linkProblem([{ otherId: "cian", role: "parent" }, { otherId: "cian", role: "child" }])).toBe("Those two parent links point at each other.");
    expect(linkProblem([{ otherId: "cian", role: "sibling" }])).toBeNull();
  });
});
