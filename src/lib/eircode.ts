import { EIRCODE_AREAS, type EircodeTown } from "./eircodeAreas";

const UNIQUE_IDENTIFIER = /^[0-9AC-FHKNPRTV-Y]{4}$/;

export interface EircodeLookup {
  routingKey: string;
  /** Four-character unique identifier when the code is complete. */
  uniqueIdentifier: string | null;
  /** Display form, such as A65 F4E2, when the code is complete. */
  formatted: string | null;
  /** `area` while the unique identifier is still incomplete. */
  status: "area" | "complete" | "invalid";
  towns: readonly EircodeTown[];
}

/**
 * Routing-area lookup for an Eircode.
 * The first three characters identify the post town. The last four identify one address
 * and are not resolved here.
 */
export function lookupEircode(value: string): EircodeLookup | null {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const routingKey = compact.startsWith("D6W") ? "D6W" : compact.slice(0, 3);
  const towns = EIRCODE_AREAS[routingKey];
  if (!towns || compact.length < routingKey.length) return null;

  const rest = compact.slice(routingKey.length);
  const complete = UNIQUE_IDENTIFIER.test(rest);
  const stillTyping = rest.length > 0 && rest.length < 4 && /^[0-9AC-FHKNPRTV-Y]+$/.test(rest);
  const status = complete ? "complete" : rest.length === 0 || stillTyping ? "area" : "invalid";

  return {
    routingKey,
    uniqueIdentifier: complete ? rest : null,
    formatted: complete ? `${routingKey} ${rest}` : null,
    status,
    towns,
  };
}

/** Canonical display form when the code is a complete Eircode, otherwise the trimmed input. */
export function presentEircode(value: string): string {
  return lookupEircode(value)?.formatted ?? value.trim();
}

export function eircodeSummary(lookup: EircodeLookup): string {
  const subject = lookup.formatted ?? lookup.routingKey;
  const area = describeArea(subject, lookup.towns);
  if (lookup.status === "invalid") {
    return `${area}. The characters after the routing key are not a valid Eircode.`;
  }
  return `${area}.`;
}

export function addressMatchesEircode(city: string, region: string, lookup: EircodeLookup): boolean {
  const cityKey = normalizePlace(city);
  const regionKey = normalizePlace(region);
  if (!cityKey || !regionKey) return false;
  return lookup.towns.some((town) => normalizePlace(town.town) === cityKey && normalizePlace(town.county) === regionKey);
}

/** Town and county that can be filled from a routing key. Blank when the key is ambiguous. */
export function eircodeAreaDefaults(postalCode: string): { city: string; region: string } | null {
  const lookup = lookupEircode(postalCode);
  if (!lookup) return null;
  const counties = [...new Set(lookup.towns.map((town) => town.county))];
  const city = lookup.towns.length === 1 ? lookup.towns[0].town : "";
  const region = counties.length === 1 ? counties[0] : "";
  if (!city && !region) return null;
  return { city, region };
}

export function eircodeMailingNote(address: {
  format: string;
  postalCode: string;
  city: string;
  region: string;
}): string | null {
  if (address.format !== "ie" || !address.postalCode.trim()) return null;
  const lookup = lookupEircode(address.postalCode);
  if (!lookup) return "This is not a recognised Eircode.";
  if (addressMatchesEircode(address.city, address.region, lookup)) return null;
  return eircodeSummary(lookup);
}

function describeArea(subject: string, towns: readonly EircodeTown[]): string {
  if (towns.length === 1) {
    return `${subject} is in ${placePhrase(towns[0])}, Co. ${towns[0].county}`;
  }

  const counties = [...new Set(towns.map((town) => town.county))];
  const names = towns.map((town) => (counties.length === 1 ? placeName(town) : `${placeName(town)} (${town.county})`));
  if (counties.length === 1) return `${subject} covers ${joinList(names)}, Co. ${counties[0]}`;
  return `${subject} covers ${joinList(names)}`;
}

function placePhrase(town: EircodeTown): string {
  if (town.label) return town.label;
  return `the ${town.town} area`;
}

function placeName(town: EircodeTown): string {
  return town.label ?? town.town;
}

function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function normalizePlace(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^(co\.|county)\s+/, "")
    .replace(/\s+/g, " ");
}
