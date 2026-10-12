import { describe, expect, it } from "vitest";
import { EIRCODE_AREAS } from "./eircodeAreas";
import {
  addressMatchesEircode,
  eircodeAreaDefaults,
  eircodeMailingNote,
  eircodeSummary,
  lookupEircode,
  presentEircode,
} from "./eircode";

describe("lookupEircode", () => {
  it("lists all 139 routing keys", () => {
    expect(Object.keys(EIRCODE_AREAS)).toHaveLength(139);
    expect(EIRCODE_AREAS.D6W[0]).toEqual({ town: "Dublin 6W", county: "Dublin" });
    expect(EIRCODE_AREAS.F26[0]?.county).toBe("Mayo");
    expect(EIRCODE_AREAS.X35[0]?.county).toBe("Waterford");
  });

  it("reads a complete Eircode and its routing area", () => {
    const lookup = lookupEircode("a98f4e2");
    expect(lookup).toMatchObject({
      routingKey: "A98",
      uniqueIdentifier: "F4E2",
      formatted: "A98 F4E2",
      status: "complete",
      towns: [{ town: "Bray", county: "Wicklow" }],
    });
    expect(eircodeSummary(lookup!)).toBe("A98 F4E2 is in the Bray area, Co. Wicklow.");
    expect(presentEircode("  d6w pv38 ")).toBe("D6W PV38");
    expect(eircodeSummary(lookupEircode("D02 X285")!)).toBe("D02 X285 is in the Dublin 2 area, Co. Dublin.");
    expect(lookupEircode("A65 F4E2")).toBeNull();
  });

  it("keeps the routing area while the unique identifier is incomplete", () => {
    expect(lookupEircode("k36")?.status).toBe("area");
    expect(eircodeSummary(lookupEircode("K36")!)).toBe("K36 is in the Malahide area, Co. Dublin.");
    expect(lookupEircode("K36X")?.status).toBe("area");
    expect(lookupEircode("")).toBeNull();
    expect(lookupEircode("K3")).toBeNull();
  });

  it("rejects a routing key that is not in use and a unique identifier with a disallowed letter", () => {
    expect(lookupEircode("SW1A 2AA")).toBeNull();
    expect(lookupEircode("A00 F4E2")).toBeNull();
    const lookup = lookupEircode("K36 AB12");
    expect(lookup?.status).toBe("invalid");
    expect(lookup?.formatted).toBeNull();
    expect(eircodeSummary(lookup!)).toBe(
      "K36 is in the Malahide area, Co. Dublin. The characters after the routing key are not a valid Eircode.",
    );
    expect(presentEircode("K36 AB12")).toBe("K36 AB12");
  });

  it("names every town when a routing key covers more than one", () => {
    expect(eircodeSummary(lookupEircode("A63")!)).toBe(
      "A63 covers Delgany, Greystones, Kilcoole, Newcastle, and Newtownmountkennedy, Co. Wicklow.",
    );
    expect(eircodeSummary(lookupEircode("A82 F4E2")!)).toBe(
      "A82 F4E2 covers Kells (Meath), Kingscourt (Cavan), and Virginia (Cavan).",
    );
    expect(eircodeSummary(lookupEircode("T12 F4E2")!)).toBe("T12 F4E2 is in Cork (centre and southside), Co. Cork.");
    expect(eircodeSummary(lookupEircode("K67 F4E2")!)).toBe("K67 F4E2 is in Swords and Dublin Airport, Co. Dublin.");
  });
});

describe("eircodeAreaDefaults", () => {
  it("fills a single post town and leaves a shared key's town blank", () => {
    expect(eircodeAreaDefaults("A98 F4E2")).toEqual({ city: "Bray", region: "Wicklow" });
    expect(eircodeAreaDefaults("A63 F4E2")).toEqual({ city: "", region: "Wicklow" });
    expect(eircodeAreaDefaults("A82 F4E2")).toBeNull();
    expect(eircodeAreaDefaults("SW1A 2AA")).toBeNull();
  });

  it("matches a town and county already on the address", () => {
    const lookup = lookupEircode("A98 F4E2")!;
    expect(addressMatchesEircode("Bray", "Co. Wicklow", lookup)).toBe(true);
    expect(addressMatchesEircode("Bray", "Dublin", lookup)).toBe(false);
    expect(addressMatchesEircode("", "Wicklow", lookup)).toBe(false);
    expect(addressMatchesEircode("Kells", "County Meath", lookupEircode("A82")!)).toBe(true);
  });

  it("stays quiet on a mailing card when the town already agrees", () => {
    expect(
      eircodeMailingNote({ format: "ie", postalCode: "A98 F4E2", city: "Bray", region: "Wicklow" }),
    ).toBeNull();
    expect(
      eircodeMailingNote({ format: "ie", postalCode: "A98 F4E2", city: "", region: "" }),
    ).toBe("A98 F4E2 is in the Bray area, Co. Wicklow.");
    expect(eircodeMailingNote({ format: "ie", postalCode: "SW1A 2AA", city: "London", region: "" })).toBe(
      "This is not a recognised Eircode.",
    );
    expect(eircodeMailingNote({ format: "international", postalCode: "SW1A 2AA", city: "London", region: "" })).toBeNull();
  });
});
