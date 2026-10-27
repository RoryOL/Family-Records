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
    expect(member.deceased).toBe(false);
    expect(member.dateOfDeath).toBeNull();
    expect(member.phone).toBeNull();
    expect(member.email).toBeNull();
    expect(member.notes).toBe("note");
    expect(member.linkedUserId).toBeNull();
    expect(member.photoPath).toBeNull();
    expect(member.photoUrl).toBeNull();
    expect(member.address?.id).toMatch(/^adr_/);
    expect(member.address?.line1).toBe("1 King Street");
  });

  it("stores a complete Irish Eircode with a space", () => {
    const member = createMember("grp", {
      firstName: "Aoife",
      lastName: "Murphy",
      relationship: "",
      dateOfBirth: null,
      phone: null,
      email: null,
      address: {
        format: "ie",
        line1: "1 Abbey Street",
        line2: "",
        city: "Dublin 2",
        region: "Dublin",
        postalCode: "d02x285",
        country: "Ireland",
        verified: false,
      },
      notes: "",
    });
    expect(member.address?.postalCode).toBe("D02 X285");
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

describe("recorded death", () => {
  it("treats a death date as deceased and drops an impossible date", () => {
    const member = createMember("grp", {
      firstName: "Arthur",
      lastName: "Ellison",
      relationship: "Parent",
      dateOfBirth: "1956-12-18",
      dateOfDeath: "2019-03-02",
      phone: null,
      email: null,
      address: null,
      notes: "",
    });
    expect(member.deceased).toBe(true);
    expect(member.dateOfDeath).toBe("2019-03-02");

    const flagged = createMember("grp", {
      firstName: "Ruth",
      lastName: "Ellison",
      relationship: "",
      dateOfBirth: null,
      deceased: true,
      dateOfDeath: "2019-02-31",
      phone: null,
      email: null,
      address: null,
      notes: "",
    });
    expect(flagged.deceased).toBe(true);
    expect(flagged.dateOfDeath).toBeNull();
  });

  it("keeps a recorded death when other fields change and clears it when the flag is removed", () => {
    const elena = { ...createInitialState().members[0], deceased: true, dateOfDeath: "2020-01-02" };
    const kept = mergeMember(elena, { notes: "Updated" }, "2026-09-21T00:00:00.000Z");
    expect(kept.deceased).toBe(true);
    expect(kept.dateOfDeath).toBe("2020-01-02");

    const living = mergeMember(kept, { deceased: false }, "2026-09-22T00:00:00.000Z");
    expect(living.deceased).toBe(false);
    expect(living.dateOfDeath).toBeNull();

    const undated = mergeMember(elena, { dateOfDeath: null }, "2026-09-23T00:00:00.000Z");
    expect(undated.deceased).toBe(true);
    expect(undated.dateOfDeath).toBeNull();
  });
});

describe("mergeMember", () => {
  it("rebuilds the full name when a given name changes", () => {
    const elena = createInitialState().members[0];
    const pictured = { ...elena, photoPath: "grp_harpers/mem_elena.jpg", photoUrl: "https://example.test/elena.jpg" };
    const updated = mergeMember(pictured, { firstName: "Eleanor" }, "2026-09-21T00:00:00.000Z");
    expect(updated.fullName).toBe("Eleanor Harper");
    expect(updated.id).toBe(elena.id);
    expect(updated.linkedUserId).toBe(elena.linkedUserId);
    expect(updated.photoPath).toBe("grp_harpers/mem_elena.jpg");
    expect(updated.photoUrl).toBe("https://example.test/elena.jpg");
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
