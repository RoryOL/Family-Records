import { describe, expect, it } from "vitest";
import { createInitialState } from "../data/mockFamily";
import { addressBadge, initialsFrom, isBirthdaySoon, nextBirthdayLabel } from "./memberDisplay";

const september22 = new Date(2026, 8, 22);

describe("member display", () => {
  it("describes the next birthday from a fixed day", () => {
    expect(nextBirthdayLabel("1986-09-23", september22)).toBe("Turns 40 tomorrow");
    expect(nextBirthdayLabel("2016-09-26", september22)).toBe("Turns 10 in 4 days");
    expect(nextBirthdayLabel(null)).toBeNull();
    expect(isBirthdaySoon("1986-09-23", 7, september22)).toBe(true);
    expect(isBirthdaySoon("1994-09-21", 7, september22)).toBe(false);
  });

  it("builds initials from the name, and a question mark when the name is blank", () => {
    expect(initialsFrom("Elena", "Harper")).toBe("EH");
    expect(initialsFrom(" Aoife ", "")).toBe("A");
    expect(initialsFrom("  ", " ")).toBe("?");
  });

  it("marks incomplete addresses and verified cities differently", () => {
    const members = createInitialState().members;
    const elena = members.find((member) => member.id === "mem_elena");
    const priya = members.find((member) => member.id === "mem_priya");
    expect(addressBadge(elena!.address)).toEqual({ label: "Verified", tone: "sage", place: "Portland, OR" });
    expect(addressBadge(priya!.address)).toEqual({ label: "Incomplete", tone: "gold", place: "12 Market Street" });
    expect(addressBadge(null)).toEqual({ label: "No address", tone: "muted", place: "" });
  });
});
