import { parseIsoDate } from "../lib/dates";
import { emptyGodparentSlots, godparentProblem, slotsFromGodparents, type GodparentSlot } from "../lib/godparents";
import { linkProblem } from "../lib/kinship";
import { fullNameFrom } from "../lib/members";
import type { AddressFormat, AddressInput, Gender, Godparent, Member, MemberDraft, MemberLinkInput } from "../types";

export interface MemberFormValues {
  firstName: string;
  lastName: string;
  relationship: string;
  gender: "" | Gender;
  links: MemberLinkInput[];
  godparents: [GodparentSlot, GodparentSlot];
  dateOfBirth: string;
  phone: string;
  email: string;
  addressFormat: AddressFormat;
  line1: string;
  line2: string;
  line3: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  verified: boolean;
  notes: string;
}

export interface MemberFormErrors {
  firstName?: string;
  dateOfBirth?: string;
  email?: string;
  links?: string;
  godparents?: string;
}

export function emptyFormValues(): MemberFormValues {
  return {
    firstName: "",
    lastName: "",
    relationship: "",
    gender: "",
    links: [],
    godparents: emptyGodparentSlots(),
    dateOfBirth: "",
    phone: "",
    email: "",
    addressFormat: "ie",
    line1: "",
    line2: "",
    line3: "",
    city: "",
    region: "",
    postalCode: "",
    country: "Ireland",
    verified: false,
    notes: "",
  };
}

export function memberToFormValues(member: Member, links: readonly MemberLinkInput[] = [], godparents: readonly Godparent[] = []): MemberFormValues {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    relationship: member.relationship,
    gender: member.gender ?? "",
    links: links.map((link) => ({ ...link })),
    godparents: slotsFromGodparents(member.id, godparents),
    dateOfBirth: member.dateOfBirth ?? "",
    phone: member.phone ?? "",
    email: member.email ?? "",
    addressFormat: member.address?.format ?? "ie",
    line1: member.address?.line1 ?? "",
    line2: member.address?.line2 ?? "",
    line3: member.address?.line3 ?? "",
    city: member.address?.city ?? "",
    region: member.address?.region ?? "",
    postalCode: member.address?.postalCode ?? "",
    country: member.address?.country ?? "Ireland",
    verified: member.address?.verified ?? false,
    notes: member.notes,
  };
}

export function validateMemberForm(values: MemberFormValues, selfId?: string): MemberFormErrors {
  const errors: MemberFormErrors = {};
  if (!values.firstName.trim()) errors.firstName = "Enter a first name.";

  const dateOfBirth = values.dateOfBirth.trim();
  if (dateOfBirth && !parseIsoDate(dateOfBirth)) errors.dateOfBirth = "Enter a real date.";

  const email = values.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter an email like name@example.com.";
  }

  const links = linkProblem(values.links);
  if (links) errors.links = links;

  const godparents = godparentProblem(values.godparents, selfId);
  if (godparents) errors.godparents = godparents;

  return errors;
}

export function hasFormErrors(errors: MemberFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function dateWarning(iso: string, today = new Date()): string | null {
  const parsed = parseIsoDate(iso.trim());
  if (!parsed) return null;
  const date = new Date(parsed.year, parsed.month - 1, parsed.day);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() > start.getTime()) return "This date is in the future.";
  return null;
}

export function formValuesToDraft(values: MemberFormValues, addressId?: string): MemberDraft {
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();

  return {
    firstName,
    lastName,
    fullName: fullNameFrom(firstName, lastName),
    relationship: values.relationship,
    gender: values.gender || null,
    dateOfBirth: values.dateOfBirth.trim() || null,
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    notes: values.notes,
    address: addressFromForm(values, addressId),
  };
}

function addressFromForm(values: MemberFormValues, addressId?: string): AddressInput | null {
  const country = values.country.trim();
  const countryCounts = values.addressFormat === "international" && country.length > 0 && country.toLowerCase() !== "ireland";
  const hasText =
    countryCounts ||
    [values.line1, values.line2, values.line3, values.city, values.region, values.postalCode].some((part) => part.trim());
  if (!hasText && !values.verified) return null;

  const storedCountry = country || (values.addressFormat === "ie" ? "Ireland" : "");

  return {
    id: addressId,
    format: values.addressFormat,
    line1: values.line1,
    line2: values.line2,
    line3: values.line3,
    city: values.city,
    region: values.region,
    postalCode: values.postalCode,
    country: storedCountry,
    verified: values.verified,
  };
}
