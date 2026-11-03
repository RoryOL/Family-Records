import { describe, expect, it } from "vitest";
import { displayDate, isYoungerThan, parseFlexibleDate, parseIsoDate, toIsoDate } from "./dates";

describe("parseIsoDate", () => {
  it("accepts a real calendar date", () => {
    expect(parseIsoDate("2024-02-29")).toEqual({ year: 2024, month: 2, day: 29 });
  });

  it("rejects impossible dates", () => {
    expect(parseIsoDate("2015-02-29")).toBeNull();
    expect(parseIsoDate("2020-13-01")).toBeNull();
    expect(parseIsoDate("2020-00-10")).toBeNull();
    expect(parseIsoDate("03/14/2001")).toBeNull();
  });
});

describe("isYoungerThan", () => {
  it("compares calendar days and ignores a missing date", () => {
    expect(isYoungerThan("2015-01-02", "2000-06-01")).toBe(true);
    expect(isYoungerThan("2000-01-01", "2000-01-01")).toBe(false);
    expect(isYoungerThan("1990-01-01", "2000-01-01")).toBe(false);
    expect(isYoungerThan(null, "2000-01-01")).toBe(false);
    expect(isYoungerThan("2015-01-01", "")).toBe(false);
    expect(isYoungerThan("2015-02-31", "2000-01-01")).toBe(false);
  });
});

describe("parseFlexibleDate", () => {
  it("reads a typed day month year date and keeps an ISO date", () => {
    expect(parseFlexibleDate("18/12/1956")).toBe("1956-12-18");
    expect(parseFlexibleDate("8/1/1956")).toBe("1956-01-08");
    expect(parseFlexibleDate("18.12.1956")).toBe("1956-12-18");
    expect(parseFlexibleDate("18-12-1956")).toBe("1956-12-18");
    expect(parseFlexibleDate(" 18 / 12 / 1956 ")).toBe("1956-12-18");
    expect(parseFlexibleDate("1956-12-18")).toBe("1956-12-18");
    expect(displayDate("1956-12-18")).toBe("18/12/1956");
    expect(displayDate("18/12/1956")).toBe("18/12/1956");
  });

  it("rejects an impossible or unfinished date", () => {
    expect(parseFlexibleDate("29/02/2015")).toBeNull();
    expect(parseFlexibleDate("31/02/2019")).toBeNull();
    expect(parseFlexibleDate("18/12/56")).toBeNull();
    expect(parseFlexibleDate("18/12")).toBeNull();
    expect(displayDate("18/12")).toBe("18/12");
  });
});

describe("toIsoDate", () => {
  it("formats the local calendar day", () => {
    expect(toIsoDate(new Date(2026, 8, 21))).toBe("2026-09-21");
  });
});
