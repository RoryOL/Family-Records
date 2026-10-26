import { isDeceased } from "./members";
import type { Member } from "../types";

export function verifiedMailingMembers(members: readonly Member[]): Member[] {
  return members
    .filter((member) => member.address?.verified && !isDeceased(member))
    .slice()
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName) || a.id.localeCompare(b.id));
}

function csvField(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`;
  return safe;
}

/** UTF-8 CSV of verified mailing addresses, with a BOM so spreadsheet apps keep accents. */
export function mailingCsv(members: readonly Member[]): string {
  const header = ["Name", "Address line 1", "Address line 2", "Address line 3", "Town/City", "County/Region", "Eircode/Postal code", "Country"];
  const lines = [header.join(",")];

  for (const member of verifiedMailingMembers(members)) {
    const address = member.address;
    if (!address) continue;
    lines.push(
      [member.fullName, address.line1, address.line2, address.line3, address.city, address.region, address.postalCode, address.country]
        .map(csvField)
        .join(","),
    );
  }

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
