import { describe, expect, it } from "vitest";
import { createInitialState } from "../data/mockFamily";
import type { Member } from "../types";
import { mailingCsv, verifiedMailingMembers } from "./mailingCsv";

describe("mailing export", () => {
  it("lists only verified addresses, sorted by name", () => {
    const ready = verifiedMailingMembers(createInitialState().members).map((member) => member.fullName);
    expect(ready).toEqual([
      "Nora Blake",
      "Helen Cho",
      "Arthur Ellison",
      "Ruth Ellison",
      "Elena Harper",
      "Jonah Harper",
      "Marcus Harper",
      "Willa Harper",
      "Samir Shah",
    ]);
  });

  it("quotes fields that contain commas and neutralizes spreadsheet formulas", () => {
    const member: Member = {
      id: "mem_csv",
      familyGroupId: "grp",
      firstName: "=Ada",
      lastName: "Lovelace",
      fullName: "=Ada Lovelace",
      relationship: "Friend",
      dateOfBirth: null,
      phone: null,
      email: null,
      address: {
        id: "adr_csv",
        format: "international",
        line1: "10 Downing Street",
        line2: "Apt, 4",
        line3: "",
        city: "London",
        region: "Greater London",
        postalCode: "SW1A 2AA",
        country: "United Kingdom",
        verified: true,
      },
      notes: "",
      linkedUserId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const csv = mailingCsv([member]);
    expect(csv.startsWith("\uFEFFName,Address line 1,Address line 2,Address line 3,Town/City,County/Region,Eircode/Postal code,Country\r\n")).toBe(true);
    expect(csv).toContain("'=Ada Lovelace,10 Downing Street,\"Apt, 4\",,London,Greater London,SW1A 2AA,United Kingdom");
  });
});
