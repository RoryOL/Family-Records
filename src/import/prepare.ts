import { parseIsoDate } from "../lib/dates";
import { eircodeAreaDefaults, lookupEircode, presentEircode } from "../lib/eircode";
import type { AddressFormat, ColumnMapping, ImportIssue, ImportTargetField, MemberDraft } from "../types";

export const IMPORT_TARGETS: { value: ImportTargetField | "ignore"; label: string }[] = [
  { value: "ignore", label: "Don't import" },
  { value: "firstName", label: "First name" },
  { value: "lastName", label: "Last name" },
  { value: "dateOfBirth", label: "Date of birth" },
  { value: "dateOfDeath", label: "Date of death" },
  { value: "deceased", label: "Deceased" },
  { value: "relationship", label: "Relationship" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "notes", label: "Notes" },
  { value: "address", label: "Address" },
  { value: "addressLine1", label: "Address line 1" },
  { value: "addressLine2", label: "Address line 2" },
  { value: "addressLine3", label: "Address line 3" },
  { value: "city", label: "Town/City" },
  { value: "region", label: "County/Region" },
  { value: "postalCode", label: "Eircode/Postal code" },
  { value: "country", label: "Country" },
];

const HEADER_HINTS: { target: ImportTargetField; pattern: RegExp }[] = [
  { target: "firstName", pattern: /^(first[\s_-]?name|given[\s_-]?name|forename)$/i },
  { target: "lastName", pattern: /^(last[\s_-]?name|surname|family[\s_-]?name)$/i },
  { target: "dateOfBirth", pattern: /^(dob|birthday|birth[\s_-]?date|date[\s_-]?of[\s_-]?birth)$/i },
  { target: "dateOfDeath", pattern: /^(dod|died|death[\s_-]?date|date[\s_-]?of[\s_-]?death)$/i },
  { target: "deceased", pattern: /^(deceased)$/i },
  { target: "relationship", pattern: /^(relationship|relation)$/i },
  { target: "phone", pattern: /^(phone|mobile|tel|telephone)$/i },
  { target: "email", pattern: /^(e-?mail)$/i },
  { target: "notes", pattern: /^(notes?)$/i },
  { target: "addressLine1", pattern: /^(address[\s_-]?line[\s_-]?1|address[\s_-]?1|line[\s_-]?1|street)$/i },
  { target: "addressLine2", pattern: /^(address[\s_-]?line[\s_-]?2|address[\s_-]?2|line[\s_-]?2)$/i },
  { target: "addressLine3", pattern: /^(address[\s_-]?line[\s_-]?3|address[\s_-]?3|line[\s_-]?3)$/i },
  { target: "address", pattern: /^(address|full[\s_-]?address|postal[\s_-]?address)$/i },
  { target: "city", pattern: /^(town(\s*\/\s*city)?|city)$/i },
  { target: "region", pattern: /^(county(\s*\/\s*region)?|region|state|province)$/i },
  { target: "postalCode", pattern: /^(eir\s?code(\s*\/\s*postal(\s*code)?)?|postal(\s*code)?|post\s?code|zip(\s*code)?)$/i },
  { target: "country", pattern: /^(country)$/i },
];

export interface ImportRowPlan {
  rowNumber: number;
  draft: MemberDraft | null;
  issues: ImportIssue[];
}

export function suggestMappings(headers: readonly string[]): ColumnMapping[] {
  const used = new Set<ImportTargetField>();
  return headers.map((sourceHeader) => {
    const hint = HEADER_HINTS.find((candidate) => candidate.pattern.test(sourceHeader.trim()));
    const target = hint && !used.has(hint.target) ? hint.target : "ignore";
    if (target !== "ignore") used.add(target);
    return { sourceHeader, target };
  });
}

export function previewImport(
  headers: readonly string[],
  rows: readonly { rowNumber: number; cells: readonly string[] }[],
  mappings: readonly ColumnMapping[],
  existingNames: readonly string[],
  today = new Date(),
): ImportRowPlan[] {
  const seen = new Set(existingNames.map(normalizeName));
  const plans: ImportRowPlan[] = [];

  for (const row of rows) {
    if (row.cells.every((cell) => !cell.trim())) continue;

    const issues: ImportIssue[] = [];
    const values = readTargets(headers, row, mappings, issues);
    const firstName = values.firstName?.trim() ?? "";
    const lastName = values.lastName?.trim() ?? "";

    if (!firstName) {
      issues.push({ rowNumber: row.rowNumber, field: "firstName", message: "Enter a first name.", severity: "error" });
    }

    const dateOfBirth = readDate(values.dateOfBirth ?? "", row.rowNumber, issues, today, "dateOfBirth");
    const dateOfDeath = readDate(values.dateOfDeath ?? "", row.rowNumber, issues, today, "dateOfDeath");
    const deceasedFlag = readDeceased(values.deceased ?? "", row.rowNumber, issues);
    if (dateOfBirth && dateOfDeath && dateOfDeath < dateOfBirth) {
      issues.push({
        rowNumber: row.rowNumber,
        field: "dateOfDeath",
        message: "Date of death is before the date of birth.",
        severity: "error",
      });
    }
    const email = readEmail(values.email ?? "", row.rowNumber, issues);
    const address = readAddress(values);
    if (address) applyEircodeLookup(address, row.rowNumber, issues);
    const nameKey = normalizeName(`${firstName} ${lastName}`);

    if (firstName && seen.has(nameKey)) {
      issues.push({
        rowNumber: row.rowNumber,
        field: "row",
        message: `${firstName} ${lastName}`.trim() + " is already in this import or household.",
        severity: "warning",
      });
    }
    if (firstName) seen.add(nameKey);

    const blocked = issues.some((issue) => issue.severity === "error");
    plans.push({
      rowNumber: row.rowNumber,
      draft: blocked
        ? null
        : {
            firstName,
            lastName,
            relationship: values.relationship?.trim() ?? "",
            dateOfBirth,
            deceased: Boolean(dateOfDeath) || deceasedFlag,
            dateOfDeath,
            phone: values.phone?.trim() || null,
            email,
            notes: values.notes?.trim() ?? "",
            address,
          },
      issues,
    });
  }

  return plans;
}

function readTargets(
  headers: readonly string[],
  row: { rowNumber: number; cells: readonly string[] },
  mappings: readonly ColumnMapping[],
  issues: ImportIssue[],
): Partial<Record<ImportTargetField, string>> {
  const values: Partial<Record<ImportTargetField, string>> = {};

  mappings.forEach((mapping, index) => {
    if (mapping.target === "ignore") return;
    const cell = row.cells[index]?.trim() ?? "";
    if (!cell) return;
    const current = values[mapping.target];
    if (current) {
      issues.push({
        rowNumber: row.rowNumber,
        field: mapping.target,
        message: `${labelFor(mapping.target)} is mapped twice. “${headers[index] ?? mapping.sourceHeader}” was left out.`,
        severity: "warning",
      });
      return;
    }
    values[mapping.target] = cell;
  });

  return values;
}

function readDate(
  value: string,
  rowNumber: number,
  issues: ImportIssue[],
  today: Date,
  field: "dateOfBirth" | "dateOfDeath",
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const iso = parseImportDate(trimmed);
  if (!iso) {
    issues.push({
      rowNumber,
      field,
      message: `“${trimmed}” is not a date. Use a day/month/year or YYYY-MM-DD.`,
      severity: "error",
    });
    return null;
  }

  const parsed = parseIsoDate(iso);
  if (parsed) {
    const date = new Date(parsed.year, parsed.month - 1, parsed.day);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (date.getTime() > start.getTime()) {
      issues.push({ rowNumber, field, message: "This date is in the future.", severity: "warning" });
    }
  }
  return iso;
}

function readDeceased(value: string, rowNumber: number, issues: ImportIssue[]): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(y|yes|true|1)$/i.test(trimmed)) return true;
  if (/^(n|no|false|0)$/i.test(trimmed)) return false;
  issues.push({
    rowNumber,
    field: "deceased",
    message: `“${trimmed}” is not a yes or no. Use yes or no.`,
    severity: "error",
  });
  return false;
}

/** Day-first dates, plus ISO. A value such as 05/06/2020 is 5 June 2020. */
export function parseImportDate(value: string, currentYear = new Date().getFullYear()): string | null {
  const iso = parseIsoDate(value.trim());
  if (iso) return formatIso(iso.year, iso.month, iso.day);

  const match = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = expandYear(Number(match[3]), currentYear);
  if (!parseIsoDate(formatIso(year, month, day))) return null;
  return formatIso(year, month, day);
}

function expandYear(year: number, currentYear: number): number {
  if (year >= 100) return year;
  const current = currentYear % 100;
  return year <= current ? 2000 + year : 1900 + year;
}

function formatIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function readEmail(value: string, rowNumber: number, issues: ImportIssue[]): string | null {
  const email = value.trim();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    issues.push({ rowNumber, field: "email", message: "Enter an email like name@example.com.", severity: "error" });
    return null;
  }
  return email;
}

function applyEircodeLookup(address: NonNullable<MemberDraft["address"]>, rowNumber: number, issues: ImportIssue[]) {
  if (address.format !== "ie" || !address.postalCode.trim()) return;

  const lookup = lookupEircode(address.postalCode);
  if (!lookup) {
    issues.push({
      rowNumber,
      field: "postalCode",
      message: "This is not a recognised Eircode.",
      severity: "warning",
    });
    return;
  }

  address.postalCode = presentEircode(address.postalCode);
  if (lookup.status === "invalid") {
    issues.push({
      rowNumber,
      field: "postalCode",
      message: "The characters after the routing key are not a valid Eircode.",
      severity: "warning",
    });
  }

  const defaults = eircodeAreaDefaults(address.postalCode);
  if (!defaults) {
    if (!address.city.trim() || !address.region.trim()) {
      const code = lookup.formatted ?? lookup.routingKey;
      issues.push({
        rowNumber,
        field: "postalCode",
        message: `${code} covers more than one county. Pick the town and county that match the address.`,
        severity: "warning",
      });
    }
    return;
  }
  const filledCity = !address.city.trim() && Boolean(defaults.city);
  const filledRegion = !address.region.trim() && Boolean(defaults.region);
  if (filledCity) address.city = defaults.city;
  if (filledRegion) address.region = defaults.region;
  if (!filledCity && !filledRegion) return;

  const code = lookup.formatted ?? lookup.routingKey;
  const message =
    filledCity && filledRegion
      ? `Town and county filled from ${code}: ${defaults.city}, Co. ${defaults.region}.`
      : filledRegion
        ? `County filled from ${code}: Co. ${defaults.region}. This routing key covers more than one town.`
        : `Town filled from ${code}: ${defaults.city}.`;
  issues.push({ rowNumber, field: "postalCode", message, severity: "warning" });
}

function readAddress(values: Partial<Record<ImportTargetField, string>>): MemberDraft["address"] {
  const block = splitAddress(values.address ?? "");
  const line1 = values.addressLine1?.trim() || block.line1;
  const line2 = values.addressLine2?.trim() || block.line2;
  const line3 = values.addressLine3?.trim() || block.line3;
  const city = values.city?.trim() ?? "";
  const region = values.region?.trim() ?? "";
  const postalCode = values.postalCode?.trim() ?? "";
  const country = values.country?.trim() ?? "";
  if (![line1, line2, line3, city, region, postalCode, country].some((part) => part)) return null;

  const format: AddressFormat = country && !isIreland(country) ? "international" : "ie";
  return {
    format,
    line1,
    line2,
    line3,
    city,
    region,
    postalCode,
    country: country || "Ireland",
    verified: false,
  };
}

function splitAddress(value: string): { line1: string; line2: string; line3: string } {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    line1: lines[0] ?? "",
    line2: lines[1] ?? "",
    line3: lines.slice(2).join(", "),
  };
}

function isIreland(country: string): boolean {
  const name = country.trim().toLowerCase();
  return name === "ireland" || name === "éire" || name === "eire" || name === "ie";
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function labelFor(target: ImportTargetField): string {
  return IMPORT_TARGETS.find((item) => item.value === target)?.label ?? target;
}
