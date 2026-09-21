import { describe, expect, it } from "vitest";
import { createInitialState } from "../data/mockFamily";
import { createMember, matchesMemberQuery, mergeMember } from "./members";

describe("createMember", () => {
  it("trims fields, drops blank contact details, and rejects an invalid birthday", () => {
    const member = createMember("grp_harpers", {
      firstName: " Ada ",
      lastName: " Lovelace ",
      relationship: " Friend ",
      dateOfBirth: "2015-02-29",
      phone: "  ",
      email: "",
      address: {
        line1: " 1 King Street ",
        line2: "",
        city: "London",
        region: "",
        postalCode: "SW1A 1AA",
        country: "United Kingdom",
        verified: false,
      },
      notes: "  note  ",
    });

    expect(member.id).toMatch(/^mem_/);
    expect(member.fullName).toBe("Ada Lovelace");
    expect(member.familyGroupId).toBe("grp_harpers");
    expect(member.dateOfBirth).toBeNull();
    expect(member.phone).toBeNull();
    expect(member.email).toBeNull();
    expect(member.notes).toBe("note");
    expect(member.linkedUserId).toBeNull();
    expect(member.address?.id).toMatch(/^adr_/);
    expect(member.address?.line1).toBe("1 King Street");
  });

  it("keeps an explicit full name", () => {
    const member = createMember("grp", {
      firstName: "Mary",
      lastName: "Ann",
      fullName: "Mary Ann Evans",
      relationship: "Self",
      dateOfBirth: null,
      phone: null,
      email: null,
      address: null,
      notes: "",
    });
    expect(member.fullName).toBe("Mary Ann Evans");
  });
});

describe("mergeMember", () => {
  it("rebuilds the full name when a given name changes", () => {
    const elena = createInitialState().members[0];
    const updated = mergeMember(elena, { firstName: "Eleanor" }, "2026-09-21T00:00:00.000Z");
    expect(updated.fullName).toBe("Eleanor Harper");
    expect(updated.id).toBe(elena.id);
    expect(updated.linkedUserId).toBe(elena.linkedUserId);
  });

  it("leaves a custom full name in place when other fields change", () => {
    const elena = createInitialState().members[0];
    const custom = mergeMember(elena, { fullName: "Elena M. Harper" }, "2026-09-21T00:00:00.000Z");
    const retagged = mergeMember(custom, { relationship: "Owner" }, "2026-09-22T00:00:00.000Z");
    expect(retagged.fullName).toBe("Elena M. Harper");
    expect(retagged.relationship).toBe("Owner");
  });
});

describe("matchesMemberQuery", () => {
  it("matches name or relationship and ignores surrounding space", () => {
    const members = createInitialState().members;
    const cousins = members.filter((member) => matchesMemberQuery(member, " cousin "));
    expect(cousins.map((member) => member.fullName)).toEqual(["Samir Shah", "Priya Shah"]);
    expect(members.filter((member) => matchesMemberQuery(member, "willa")).map((member) => member.id)).toEqual(["mem_willa"]);
    expect(members.every((member) => matchesMemberQuery(member, "   "))).toBe(true);
  });
});
