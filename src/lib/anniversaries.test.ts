import { describe, expect, it } from "vitest";
import type { Member, MemberRelation } from "../types";
import { anniversaryPhrase, upcomingAnniversaries, weddingsWithoutDates } from "./anniversaries";

function member(id: string, fullName: string, dateOfBirth: string | null): Member {
  return {
    id,
    familyGroupId: "grp",
    firstName: fullName.split(" ")[0] ?? fullName,
    lastName: fullName.split(" ").slice(1).join(" "),
    fullName,
    relationship: "",
    gender: null,
    dateOfBirth,
    phone: null,
    email: null,
    address: null,
    notes: "",
    linkedUserId: null,
    photoPath: null,
    photoUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function marriage(from: string, to: string, weddingDate: string | null): MemberRelation {
  const [fromMemberId, toMemberId] = from < to ? [from, to] : [to, from];
  return { id: `wed-${fromMemberId}-${toMemberId}`, familyGroupId: "grp", fromMemberId, toMemberId, kind: "married", weddingDate };
}

const september21 = new Date(2026, 8, 21);

describe("upcoming anniversaries", () => {
  const elena = member("elena", "Elena Harper", "1988-04-12");
  const marcus = member("marcus", "Marcus Harper", "1986-09-23");
  const arthur = member("arthur", "Arthur Ellison", "1956-12-18");
  const ruth = member("ruth", "Ruth Ellison", "1958-11-02");

  it("lists a wedding inside the window, with the older partner first and the years since the wedding", () => {
    const partner = { ...marriage("marcus", "ruth", null), kind: "spouse" as const, weddingDate: null };
    const relations = [marriage("elena", "marcus", "2014-09-23"), marriage("arthur", "ruth", "1979-06-21"), marriage("elena", "arthur", null), partner];
    const upcoming = upcomingAnniversaries([elena, marcus, arthur, ruth], relations, 30, september21);
    expect(upcoming.map((item) => [item.label, item.daysUntil, item.years])).toEqual([["Marcus Harper and Elena Harper", 2, 12]]);
    expect(weddingsWithoutDates([elena, marcus, arthur, ruth], relations).map((item) => item.label)).toEqual(["Arthur Ellison and Elena Harper"]);
  });

  it("calls the first occurrence a wedding day", () => {
    const today = new Date(2026, 5, 1);
    const upcoming = upcomingAnniversaries([elena, marcus], [marriage("elena", "marcus", "2026-06-08")], 30, today);
    expect(upcoming[0]?.years).toBe(0);
    expect(anniversaryPhrase(0)).toBe("celebrate their wedding day");
    expect(anniversaryPhrase(1)).toBe("celebrate their 1st anniversary");
    expect(anniversaryPhrase(12)).toBe("celebrate their 12th anniversary");
    expect(anniversaryPhrase(11)).toBe("celebrate their 11th anniversary");
  });
});
