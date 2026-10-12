import { parseIsoDate } from "./dates";
import { presentEircode } from "./eircode";
import type { Address, AddressInput, Member, MemberDraft, MemberPatch } from "../types";

export function createId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${uuid}`;
}

export function fullNameFrom(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
}

function blankToNull(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeDate(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed || !parseIsoDate(trimmed)) return null;
  return trimmed;
}

function isIreland(country: string): boolean {
  const name = country.trim().toLowerCase();
  return name === "ireland" || name === "éire" || name === "eire" || name === "ie";
}

export function normalizeAddress(input: AddressInput): Address {
  const format = input.format ?? (isIreland(input.country) || !input.country.trim() ? "ie" : "international");
  const country = input.country.trim() || (format === "ie" ? "Ireland" : "");

  return {
    id: input.id ?? createId("adr"),
    format,
    line1: input.line1.trim(),
    line2: input.line2.trim(),
    line3: (input.line3 ?? "").trim(),
    city: input.city.trim(),
    region: input.region.trim(),
    postalCode: format === "ie" ? presentEircode(input.postalCode) : input.postalCode.trim(),
    country,
    verified: input.verified,
  };
}

export function createMember(familyGroupId: string, draft: MemberDraft, now = new Date()): Member {
  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  const timestamp = now.toISOString();

  return {
    id: createId("mem"),
    familyGroupId,
    firstName,
    lastName,
    fullName: (draft.fullName ?? fullNameFrom(firstName, lastName)).trim(),
    relationship: draft.relationship.trim(),
    dateOfBirth: normalizeDate(draft.dateOfBirth),
    phone: blankToNull(draft.phone),
    email: blankToNull(draft.email),
    address: draft.address ? normalizeAddress(draft.address) : null,
    notes: draft.notes.trim(),
    linkedUserId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function mergeMember(member: Member, patch: MemberPatch, updatedAt: string): Member {
  const firstName = patch.firstName !== undefined ? patch.firstName.trim() : member.firstName;
  const lastName = patch.lastName !== undefined ? patch.lastName.trim() : member.lastName;
  const nameChanged = patch.firstName !== undefined || patch.lastName !== undefined;
  const fullName =
    patch.fullName !== undefined
      ? patch.fullName.trim()
      : nameChanged
        ? fullNameFrom(firstName, lastName)
        : member.fullName;

  return {
    ...member,
    firstName,
    lastName,
    fullName,
    relationship: patch.relationship !== undefined ? patch.relationship.trim() : member.relationship,
    dateOfBirth: patch.dateOfBirth !== undefined ? normalizeDate(patch.dateOfBirth) : member.dateOfBirth,
    phone: patch.phone !== undefined ? blankToNull(patch.phone) : member.phone,
    email: patch.email !== undefined ? blankToNull(patch.email) : member.email,
    address: patch.address !== undefined ? (patch.address ? normalizeAddress(patch.address) : null) : member.address,
    notes: patch.notes !== undefined ? patch.notes.trim() : member.notes,
    updatedAt,
  };
}

/** Match a directory query against name or relationship. */
export function matchesMemberQuery(member: Member, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [member.fullName, member.firstName, member.lastName, member.relationship].some((value) =>
    value.toLowerCase().includes(needle),
  );
}
