import { describe, expect, it } from "vitest";
import { createInitialState } from "../data/mockFamily";
import type { Member } from "../types";
import { birthdayCalendar } from "./calendar";

describe("birthdayCalendar", () => {
  it("publishes a yearly event for each dated member and skips a missing birthday", () => {
    const calendar = birthdayCalendar(createInitialState().members, "The Harpers", new Date(Date.UTC(2026, 8, 22, 15, 4, 5)));

    expect(calendar.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(calendar).toContain("X-WR-CALNAME:The Harpers");
    expect(calendar).toContain("DTSTAMP:20260922T150405Z");
    expect(calendar).toContain("DTSTART;VALUE=DATE:19860923");
    expect(calendar).toContain("RRULE:FREQ=YEARLY");
    expect(calendar).toContain("SUMMARY:Marcus Harper's birthday");
    expect(calendar).not.toContain("Priya Shah");
    expect(calendar.split("BEGIN:VEVENT").length - 1).toBe(10);
    expect(calendar.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("escapes commas and semicolons in names", () => {
    const member: Member = {
      id: "mem_comma",
      familyGroupId: "grp",
      firstName: "Ana",
      lastName: "Lopez, Jr.",
      fullName: "Ana; Lopez, Jr.",
      relationship: "Friend",
      dateOfBirth: "1990-01-02",
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

    const calendar = birthdayCalendar([member], "House, East");
    expect(calendar).toContain("X-WR-CALNAME:House\\, East");
    expect(calendar).toContain("SUMMARY:Ana\\; Lopez\\, Jr.'s birthday");
  });
});
