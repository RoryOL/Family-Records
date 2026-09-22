import { describe, expect, it } from "vitest";
import { createInitialState } from "../data/mockFamily";
import { filterMembers, listRelationships, parseDirectoryView } from "./filters";

const members = createInitialState().members;

describe("filterMembers", () => {
  it("sorts the household by last name without changing the store order", () => {
    const original = members.map((member) => member.id);
    expect(filterMembers(members, "", "").map((member) => member.fullName)).toEqual([
      "Nora Blake",
      "Helen Cho",
      "Arthur Ellison",
      "Ruth Ellison",
      "Elena Harper",
      "Jonah Harper",
      "Marcus Harper",
      "Willa Harper",
      "Chris Patel",
      "Priya Shah",
      "Samir Shah",
    ]);
    expect(members.map((member) => member.id)).toEqual(original);
  });

  it("matches a name or relationship query and can narrow to one tag", () => {
    expect(filterMembers(members, "  COUSIN ", "").map((member) => member.fullName)).toEqual(["Priya Shah", "Samir Shah"]);
    expect(filterMembers(members, "harper", "Child").map((member) => member.fullName)).toEqual([
      "Jonah Harper",
      "Willa Harper",
    ]);
    expect(filterMembers(members, "elena", "Child")).toEqual([]);
    expect(filterMembers(members, "", "child")).toEqual([]);
  });
});

describe("listRelationships", () => {
  it("returns each tag once, in alphabetical order", () => {
    expect(listRelationships(members)).toEqual(["Aunt", "Child", "Cousin", "Friend", "Parent", "Self", "Sibling", "Spouse"]);
  });
});

describe("parseDirectoryView", () => {
  it("treats anything other than table as cards", () => {
    expect(parseDirectoryView("table")).toBe("table");
    expect(parseDirectoryView("cards")).toBe("cards");
    expect(parseDirectoryView(null)).toBe("cards");
  });
});
