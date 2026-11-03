import { describe, expect, it } from "vitest";
import { familySurname, surnameChoices } from "./surnames";

describe("family surnames", () => {
  const members = [
    { id: "elena", lastName: "Harper", linkedUserId: "usr_elena" },
    { id: "marcus", lastName: "Harper", linkedUserId: null },
    { id: "ruth", lastName: "  Ellison ", linkedUserId: null },
    { id: "nora", lastName: "ellison", linkedUserId: null },
    { id: "blank", lastName: " ", linkedUserId: null },
    { id: "samir", lastName: "Shah", linkedUserId: null },
  ];

  it("uses the signed-in profile surname, then the account name", () => {
    expect(familySurname(members, { id: "usr_elena", displayName: "Elena Other" })).toBe("Harper");
    expect(familySurname(members, { id: "usr_new", displayName: "Aoife Murphy" })).toBe("Murphy");
    expect(familySurname([], { id: "usr_new", displayName: "Aoife" })).toBe("");
  });

  it("lists the family surname first, then the surnames already in the household", () => {
    expect(surnameChoices(members.map((member) => member.lastName), "Harper")).toEqual(["Harper", "Ellison", "Shah"]);
  });

  it("keeps the family surname available before anyone else has it", () => {
    expect(surnameChoices(["Shah"], "Harper")).toEqual(["Harper", "Shah"]);
  });
});
