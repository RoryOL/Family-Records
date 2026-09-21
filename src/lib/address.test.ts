import { describe, expect, it } from "vitest";
import { createInitialState } from "../data/mockFamily";
import { formatMailingLabels, formatPostalAddress, missingAddressParts } from "./address";

describe("formatPostalAddress", () => {
  it("builds a standard postal block and skips a blank unit line", () => {
    const elena = createInitialState().members.find((member) => member.id === "mem_elena");
    expect(elena?.address).toBeTruthy();
    expect(formatPostalAddress(elena!.fullName, elena!.address!)).toBe(
      ["Elena Harper", "1842 Willow Lane", "Apt 4", "Portland, OR 97214", "United States"].join("\n"),
    );
  });
});

describe("formatMailingLabels", () => {
  it("includes only verified addresses", () => {
    const state = createInitialState();
    const labels = formatMailingLabels(state.members);
    expect(labels).toContain("Elena Harper");
    expect(labels).toContain("Helen Cho");
    expect(labels).not.toContain("Priya Shah");
    expect(labels).not.toContain("Chris Patel");
  });
});

describe("missingAddressParts", () => {
  it("names the empty structured fields", () => {
    const priya = createInitialState().members.find((member) => member.id === "mem_priya");
    expect(missingAddressParts(priya!.address!)).toEqual(["city", "postal code"]);
  });
});
