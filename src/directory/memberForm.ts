import { parseIsoDate } from "../lib/dates";
import { fullNameFrom } from "../lib/members";
import type { AddressInput, Member, MemberDraft } from "../types";

export interface MemberFormValues {
  firstName: string;
  lastName: string;
  relationship: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
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
}

export function emptyFormValues(): MemberFormValues {
  return {
    firstName: "",
    lastName: "",
    relationship: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
    verified: false,
    notes: "",
  };
}

export function memberToFormValues(member: Member): MemberFormValues {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    relationship: member.relationship,
    dateOfBirth: member.dateOfBirth ?? "",
    phone: member.phone ?? "",
    email: member.email ?? "",
    line1: member.address?.line1 ?? "",
    line2: member.address?.line2 ?? "",
    city: member.address?.city ?? "",
    region: member.address?.region ?? "",
    postalCode: member.address?.postalCode ?? "",
    country: member.address?.country ?? "",
    verified: member.address?.verified ?? false,
    notes: member.notes,
  };
}

export function validateMemberForm(values: MemberFormValues): MemberFormErrors {
  const errors: MemberFormErrors = {};
  if (!values.firstName.trim()) errors.firstName = "Enter a first name.";

  const dateOfBirth = values.dateOfBirth.trim();
  if (dateOfBirth && !parseIsoDate(dateOfBirth)) errors.dateOfBirth = "Enter a real date.";

  const email = values.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter an email like name@example.com.";
  }

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
    dateOfBirth: values.dateOfBirth.trim() || null,
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    notes: values.notes,
    address: addressFromForm(values, addressId),
  };
}

function addressFromForm(values: MemberFormValues, addressId?: string): AddressInput | null {
  const hasText = [values.line1, values.line2, values.city, values.region, values.postalCode, values.country].some(
    (part) => part.trim(),
  );
  if (!hasText && !values.verified) return null;

  return {
    id: addressId,
    line1: values.line1,
    line2: values.line2,
    city: values.city,
    region: values.region,
    postalCode: values.postalCode,
    country: values.country,
    verified: values.verified,
  };
}
