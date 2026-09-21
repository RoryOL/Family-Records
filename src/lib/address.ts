import type { Address, Member } from "../types";

export function missingAddressParts(address: Address): string[] {
  const missing: string[] = [];
  if (!address.line1.trim()) missing.push("street");
  if (!address.city.trim()) missing.push("city");
  if (!address.region.trim()) missing.push("region");
  if (!address.postalCode.trim()) missing.push("postal code");
  if (!address.country.trim()) missing.push("country");
  return missing;
}

/** Standard postal block: name, street lines, city/region/code, country. */
export function formatPostalAddress(fullName: string, address: Address): string {
  const regionLine = [address.region, address.postalCode]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" ");
  const locality = [address.city.trim(), regionLine].filter((part) => part.length > 0).join(", ");

  return [fullName, address.line1, address.line2, locality, address.country]
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
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
