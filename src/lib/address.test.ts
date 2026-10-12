import { describe, expect, it } from "vitest";
import { createInitialState } from "../data/mockFamily";
import { formatMailingLabels, formatPostalAddress, missingAddressParts } from "./address";
import type { Address } from "../types";

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

describe("Irish addresses", () => {
  const malahide: Address = {
    id: "adr_ie",
    format: "ie",
    line1: "12 Main Street",
    line2: "",
    line3: "The Green",
    city: "Malahide",
    region: "Dublin",
    postalCode: "k36 ab12",
    country: "Ireland",
    verified: true,
  };

  it("prints town, county, and Eircode on their own lines", () => {
    expect(formatPostalAddress("Aoife Murphy", malahide)).toBe(
      ["Aoife Murphy", "12 Main Street", "The Green", "Malahide", "Dublin", "K36 AB12"].join("\n"),
    );
  });

  it("prints a complete Eircode with a space", () => {
    expect(formatPostalAddress("Aoife Murphy", { ...malahide, postalCode: "a98f4e2", city: "Bray", region: "Wicklow" })).toBe(
      ["Aoife Murphy", "12 Main Street", "The Green", "Bray", "Wicklow", "A98 F4E2"].join("\n"),
    );
  });

  it("asks for the Irish fields that are still empty", () => {
    expect(missingAddressParts({ ...malahide, line1: "", city: "", postalCode: "" })).toEqual(["address line 1", "town", "eircode"]);
  });
});

describe("missingAddressParts", () => {
  it("names the empty structured fields", () => {
    const priya = createInitialState().members.find((member) => member.id === "mem_priya");
    expect(missingAddressParts(priya!.address!)).toEqual(["city", "postal code"]);
  });
});
