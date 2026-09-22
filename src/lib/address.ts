import type { Address, Member } from "../types";

function isIreland(country: string): boolean {
  const name = country.trim().toLowerCase();
  return name === "" || name === "ireland" || name === "éire" || name === "eire" || name === "ie";
}

export function missingAddressParts(address: Address): string[] {
  const missing: string[] = [];
  if (address.format === "ie") {
    if (!address.line1.trim()) missing.push("address line 1");
    if (!address.city.trim()) missing.push("town");
    if (!address.region.trim()) missing.push("county");
    if (!address.postalCode.trim()) missing.push("eircode");
    return missing;
  }

  if (!address.line1.trim()) missing.push("street");
  if (!address.city.trim()) missing.push("city");
  if (!address.region.trim()) missing.push("region");
  if (!address.postalCode.trim()) missing.push("postal code");
  if (!address.country.trim()) missing.push("country");
  return missing;
}

/** Street, locality, and country, without the recipient's name. */
export function formatAddressBlock(address: Address): string {
  if (address.format === "ie") {
    const eircode = address.postalCode.trim().toUpperCase();
    const country = isIreland(address.country) ? "" : address.country;
    return [address.line1, address.line2, address.line3, address.city, address.region, eircode, country]
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");
  }

  const regionLine = [address.region, address.postalCode]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" ");
  const locality = [address.city.trim(), regionLine].filter((part) => part.length > 0).join(", ");

  return [address.line1, address.line2, address.line3, locality, address.country]
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

/** Standard postal block: name, street lines, city/region/code, country. */
export function formatPostalAddress(fullName: string, address: Address): string {
  return [fullName.trim(), formatAddressBlock(address)].filter((line) => line.length > 0).join("\n");
}

export function formatMailingLabel(member: Pick<Member, "fullName" | "address">): string | null {
  if (!member.address?.verified) return null;
  return formatPostalAddress(member.fullName, member.address);
}

export function formatMailingLabels(members: readonly Member[]): string {
  return members
    .map((member) => formatMailingLabel(member))
    .filter((label): label is string => label !== null)
    .join("\n\n");
}
