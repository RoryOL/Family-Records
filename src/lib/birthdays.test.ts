import { describe, expect, it } from "vitest";
import { createInitialState } from "../data/mockFamily";
import type { Member } from "../types";
import { birthdayTiming, nextBirthday, parseBirthdayWindow, upcomingBirthdays } from "./birthdays";

const september21 = new Date(2026, 8, 21);

function named(dateOfBirth: string, fullName: string): Member {
  return {
    id: fullName,
    familyGroupId: "grp",
    firstName: fullName,
    lastName: "Case",
    fullName,
    relationship: "Friend",
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

describe("upcomingBirthdays", () => {
  it("sorts the Harper household into 7, 30, and 90 day windows on 21 Sep 2026", () => {
    const members = createInitialState().members;

    expect(upcomingBirthdays(members, 7, september21).map((item) => [item.fullName, item.daysUntil, item.turningAge])).toEqual([
      ["Samir Shah", 0, 32],
      ["Marcus Harper", 2, 40],
      ["Jonah Harper", 5, 10],
    ]);

    expect(upcomingBirthdays(members, 30, september21).map((item) => item.fullName)).toEqual([
      "Samir Shah",
      "Marcus Harper",
      "Jonah Harper",
      "Willa Harper",
    ]);

    expect(upcomingBirthdays(members, 90, september21).map((item) => [item.fullName, item.daysUntil, item.turningAge])).toEqual([
      ["Samir Shah", 0, 32],
      ["Marcus Harper", 2, 40],
      ["Jonah Harper", 5, 10],
      ["Willa Harper", 20, 7],
      ["Ruth Ellison", 42, 68],
      ["Arthur Ellison", 88, 70],
    ]);
  });

  it("includes the last day of a window and excludes the day after", () => {
    const onTheLine = upcomingBirthdays([named("2010-12-20", "On The Line")], 90, september21);
    const pastTheLine = upcomingBirthdays([named("2010-12-21", "Past The Line")], 90, september21);
    expect(onTheLine.map((item) => item.daysUntil)).toEqual([90]);
    expect(pastTheLine).toEqual([]);
  });

  it("skips a missing date of birth", () => {
    const member = named("1990-01-01", "Skipped");
    member.dateOfBirth = null;
    expect(upcomingBirthdays([member], 365, september21)).toEqual([]);
  });
});

describe("nextBirthday", () => {
  it("observes Feb 29 on Feb 28 in a common year", () => {
    const observed = nextBirthday("2016-02-29", new Date(2027, 1, 28));
    expect(observed).toEqual({ nextOccurrence: "2027-02-28", daysUntil: 0, turningAge: 11 });
  });

  it("uses the real leap day when the next occurrence is in a leap year", () => {
    const next = nextBirthday("2016-02-29", new Date(2027, 2, 1));
    expect(next).toEqual({ nextOccurrence: "2028-02-29", daysUntil: 365, turningAge: 12 });
  });

  it("returns null for an invalid date", () => {
    expect(nextBirthday("2020-02-31")).toBeNull();
  });
});

describe("birthday windows", () => {
  it("describes how soon a birthday is", () => {
    expect(birthdayTiming(0)).toBe("today");
    expect(birthdayTiming(1)).toBe("tomorrow");
    expect(birthdayTiming(4)).toBe("in 4 days");
  });

  it("accepts only the 7, 30, and 90 day windows", () => {
    expect(parseBirthdayWindow("7")).toBe(7);
    expect(parseBirthdayWindow("90")).toBe(90);
    expect(parseBirthdayWindow("14")).toBe(30);
    expect(parseBirthdayWindow(null)).toBe(30);
  });
});
