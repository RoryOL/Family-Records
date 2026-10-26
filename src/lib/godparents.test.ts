import { describe, expect, it } from "vitest";
import type { Godparent } from "../types";
import {
  describedGodchildren,
  describedGodparents,
  detachGodparent,
  godparentProblem,
  godparentsFromSlots,
  slotsFromGodparents,
} from "./godparents";

const people = [
  { id: "jonah", fullName: "Jonah Harper" },
  { id: "ruth", fullName: "Ruth Ellison" },
  { id: "arthur", fullName: "Arthur Ellison" },
];

function row(partial: Pick<Godparent, "memberId" | "slot" | "godparentMemberId" | "godparentName">): Godparent {
  return { id: `${partial.memberId}-${partial.slot}`, familyGroupId: "grp", ...partial };
}

describe("godparents", () => {
  it("stores a household member and a typed name in the two places", () => {
    const slots = [
      { choice: "ruth", name: "" },
      { choice: "name", name: " Patrick Murphy " },
    ] as const;
    expect(godparentProblem(slots, "jonah")).toBeNull();
    const stored = godparentsFromSlots("grp", "jonah", slots, people);
    expect(stored).toMatchObject([
      { memberId: "jonah", slot: 1, godparentMemberId: "ruth", godparentName: "Ruth Ellison" },
      { memberId: "jonah", slot: 2, godparentMemberId: null, godparentName: "Patrick Murphy" },
    ]);
    expect(slotsFromGodparents("jonah", stored)).toEqual([
      { choice: "ruth", name: "" },
      { choice: "name", name: "Patrick Murphy" },
    ]);
  });

  it("rejects a repeated person, a blank typed name, and a self link", () => {
    expect(godparentProblem([{ choice: "ruth", name: "" }, { choice: "ruth", name: "" }])).toBe("Each godparent should be a different person.");
    expect(godparentProblem([{ choice: "name", name: "  " }, { choice: "", name: "" }])).toBe("Enter the godparent's name.");
    expect(godparentProblem([{ choice: "jonah", name: "" }, { choice: "", name: "" }], "jonah")).toBe("A person cannot be their own godparent.");
  });

  it("shows godparents on the child and godchildren on the sponsor", () => {
    const links = [
      row({ memberId: "jonah", slot: 1, godparentMemberId: "ruth", godparentName: "Ruth Ellison" }),
      row({ memberId: "willa", slot: 1, godparentMemberId: "ruth", godparentName: "Ruth Ellison" }),
      row({ memberId: "jonah", slot: 2, godparentMemberId: null, godparentName: "Patrick Murphy" }),
    ];
    const members = [...people, { id: "willa", fullName: "Willa Harper" }];
    expect(describedGodparents("jonah", links, members)).toEqual([
      { name: "Ruth Ellison", memberId: "ruth" },
      { name: "Patrick Murphy", memberId: null },
    ]);
    expect(describedGodchildren("ruth", links, members).map((person) => person.name)).toEqual(["Jonah Harper", "Willa Harper"]);
  });

  it("keeps the written name when a godparent leaves the household", () => {
    const links = [row({ memberId: "jonah", slot: 1, godparentMemberId: "ruth", godparentName: "Ruth Ellison" })];
    expect(detachGodparent(links, "ruth")).toEqual([{ ...links[0], godparentMemberId: null }]);
    expect(detachGodparent(links, "jonah")).toEqual([]);
  });
});