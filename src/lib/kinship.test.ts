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
  const directed = kind === "parent" || kind === "step";
  const [fromMemberId, toMemberId] = directed || from < to ? [from, to] : [to, from];
  return { id: `${kind}-${fromMemberId}-${toMemberId}`, familyGroupId: "grp", fromMemberId, toMemberId, kind, weddingDate: null };
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
      link("pat", "mary", "married"),
      link("pat", "aoife", "parent"),
      link("mary", "aoife", "parent"),
      link("uncle", "cousin", "parent"),
      link("aoife", "partner", "spouse"),
      link("aoife", "husband", "married"),
    ];
    const named = [...family, person("uncle", "Uncle", "male"), person("husband", "Hugh", "male")];
    expect(kinshipTerm("mary", "aoife", named, relations)).toBe("Mother");
    expect(kinshipTerm("pat", "aoife", named, relations)).toBe("Father");
    expect(kinshipTerm("gran", "aoife", named, relations)).toBe("Grandmother");
    expect(kinshipTerm("aoife", "mary", named, relations)).toBe("Daughter");
    expect(kinshipTerm("uncle", "aoife", named, relations)).toBe("Uncle");
    expect(kinshipTerm("cousin", "aoife", named, relations)).toBe("Cousin");
    expect(kinshipTerm("partner", "aoife", named, relations)).toBe("Partner");
    expect(kinshipTerm("partner", "mary", named, relations)).toBeNull();
    expect(kinshipTerm("husband", "aoife", named, relations)).toBe("Husband");
    expect(kinshipTerm("husband", "mary", named, relations)).toBe("Son-in-law");
  });

  it("calls a partner's or spouse's child a son or daughter", () => {
    const family = [
      person("aoife", "Aoife", "female"),
      person("alex", "Alex", "male"),
      person("hugh", "Hugh", "male"),
      person("sam", "Sam", "male"),
      person("nia", "Nia", "female"),
    ];
    const relations = [
      link("aoife", "alex", "spouse"),
      link("alex", "sam", "parent"),
      link("aoife", "hugh", "married"),
      link("hugh", "nia", "parent"),
    ];
    expect(kinshipTerm("sam", "aoife", family, relations)).toBe("Son");
    expect(kinshipTerm("nia", "aoife", family, relations)).toBe("Daughter");
    expect(kinshipTerm("aoife", "sam", family, relations)).toBe("Mother");
    expect(kinshipTerm("aoife", "nia", family, relations)).toBe("Mother");
  });

  it("calls the husband, wife, or partner of a parent a parent, and a recorded step link a step-parent", () => {
    const family = [
      person("gran", "Gran", "female"),
      person("mother", "Maeve", "female"),
      person("father", "Fionn", "male"),
      person("me", "Niamh", "female"),
      person("partner", "Alex"),
    ];
    const married = [
      link("mother", "me", "parent"),
      link("father", "mother", "married"),
      link("gran", "father", "parent"),
    ];
    expect(kinshipTerm("father", "me", family, married)).toBe("Father");
    expect(kinshipTerm("me", "father", family, married)).toBe("Daughter");
    expect(kinshipTerm("gran", "me", family, married)).toBe("Grandmother");
    expect(kinshipTerm("me", "gran", family, married)).toBe("Granddaughter");

    const partnered = [link("mother", "me", "parent"), link("partner", "mother", "spouse")];
    expect(kinshipTerm("partner", "me", family, partnered)).toBe("Parent");
    expect(kinshipTerm("me", "partner", family, partnered)).toBe("Daughter");

    const step = [...married, link("father", "me", "step")];
    expect(kinshipTerm("father", "me", family, step)).toBe("Stepfather");
    expect(kinshipTerm("me", "father", family, step)).toBe("Stepdaughter");
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

  it("stores a step-parent link from the step-parent to the child and reads it back", () => {
    const stored = applyMemberLinks([], "grp", "fionn", [{ otherId: "niamh", role: "stepparent" }]);
    expect(stored[0]).toMatchObject({ fromMemberId: "fionn", toMemberId: "niamh", kind: "step" });
    expect(linksTouching("fionn", stored)).toEqual([{ otherId: "niamh", role: "stepparent" }]);
    expect(linksTouching("niamh", stored)).toEqual([{ otherId: "fionn", role: "stepchild" }]);

    const fromChild = applyMemberLinks([], "grp", "niamh", [{ otherId: "fionn", role: "stepchild" }]);
    expect(fromChild[0]).toMatchObject({ fromMemberId: "fionn", toMemberId: "niamh", kind: "step" });
  });

  it("keeps a marriage date on a married link and leaves a partner without one", () => {
    const stored = applyMemberLinks([], "grp", "elena", [
      { otherId: "marcus", role: "married", weddingDate: "2014-09-23" },
      { otherId: "alex", role: "spouse", weddingDate: "2001-01-01" },
    ]);
    expect(stored.find((relation) => relation.kind === "married")).toMatchObject({ kind: "married", weddingDate: "2014-09-23" });
    expect(stored.find((relation) => relation.kind === "spouse")).toMatchObject({ kind: "spouse", weddingDate: null });
    expect(linksTouching("marcus", stored)).toEqual([{ otherId: "elena", role: "married", weddingDate: "2014-09-23" }]);
    expect(linksTouching("alex", stored)).toEqual([{ otherId: "elena", role: "spouse" }]);
    expect(linkProblem([{ otherId: "marcus", role: "married", weddingDate: "2014-02-31" }])).toBe("Enter a real marriage date.");
    expect(linkProblem([{ otherId: "marcus", role: "married" }, { otherId: "marcus", role: "spouse" }])).toBe(
      "Record that pair as partner or married, not both.",
    );
  });

  it("rejects a blank person, a duplicate, and parent links that point both ways", () => {
    expect(linkProblem([{ otherId: "", role: "sibling" }])).toBe("Choose the person this relationship is with.");
    expect(linkProblem([{ otherId: "cian", role: "sibling" }, { otherId: "cian", role: "sibling" }])).toBe("That relationship is already listed.");
    expect(linkProblem([{ otherId: "cian", role: "parent" }, { otherId: "cian", role: "child" }])).toBe("Those two parent links point at each other.");
    expect(linkProblem([{ otherId: "cian", role: "stepparent" }, { otherId: "cian", role: "stepchild" }])).toBe(
      "Those two parent links point at each other.",
    );
    expect(linkProblem([{ otherId: "cian", role: "parent" }, { otherId: "cian", role: "stepparent" }])).toBe(
      "Record that person as a parent or a step-parent, not both.",
    );
    expect(linkProblem([{ otherId: "cian", role: "sibling" }])).toBeNull();
  });
});
