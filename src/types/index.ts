/**
 * Family Records domain contract.
 * The in-memory store (Step 1) and the later Supabase schema share these shapes.
 */

/** Calendar date encoded as YYYY-MM-DD. */
export type IsoDate = string;

/** UTC timestamp encoded as an ISO 8601 string. */
export type IsoDateTime = string;

/** Owner manages the group. Editors can read and update member details. */
export type FamilyRole = "owner" | "editor";

/** Irish layout is the household default. International keeps street, region, and country. */
export type AddressFormat = "ie" | "international";

export interface Address {
  id: string;
  format: AddressFormat;
  line1: string;
  line2: string;
  line3: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  /**
   * Explicit flag for greeting-card mode.
   * A verified address is one the household trusts for mail.
   */
  verified: boolean;
}

export type AddressInput = Omit<Address, "id" | "line3" | "format"> & {
  id?: string;
  line3?: string;
  format?: AddressFormat;
};

export interface Member {
  id: string;
  familyGroupId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  relationship: string;
  dateOfBirth: IsoDate | null;
  phone: string | null;
  email: string | null;
  address: Address | null;
  notes: string;
  /** Auth user linked to this profile, when this person can sign in. */
  linkedUserId: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface MemberDraft {
  firstName: string;
  lastName: string;
  fullName?: string;
  relationship: string;
  dateOfBirth: IsoDate | null;
  phone: string | null;
  email: string | null;
  address: AddressInput | null;
  notes: string;
}

export type MemberPatch = Partial<MemberDraft>;

export interface FamilyGroup {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface FamilyUser {
  id: string;
  displayName: string;
  email: string;
  role: FamilyRole;
  joinedAt: IsoDateTime;
}

/** Snapshot held by the local family store. */
export interface FamilyState {
  group: FamilyGroup;
  people: FamilyUser[];
  currentUserId: string;
  members: Member[];
}

export type BirthdayWindow = 7 | 30 | 90;

export interface UpcomingBirthday {
  memberId: string;
  fullName: string;
  relationship: string;
  dateOfBirth: IsoDate;
  nextOccurrence: IsoDate;
  daysUntil: number;
  turningAge: number;
}

/** Spreadsheet headers the importer can map onto a member. */
export type ImportTargetField =
  | "firstName"
  | "lastName"
  | "dateOfBirth"
  | "relationship"
  | "phone"
  | "email"
  | "notes"
  | "address"
  | "addressLine1"
  | "addressLine2"
  | "addressLine3"
  | "city"
  | "region"
  | "postalCode"
  | "country";

export interface ColumnMapping {
  sourceHeader: string;
  target: ImportTargetField | "ignore";
}

export interface ImportIssue {
  rowNumber: number;
  field: ImportTargetField | "row";
  message: string;
  severity: "error" | "warning";
}

export const SUGGESTED_RELATIONSHIPS = [
  "Self",
  "Spouse",
  "Partner",
  "Parent",
  "Child",
  "Sibling",
  "Grandparent",
  "Grandchild",
  "Aunt",
  "Uncle",
  "Cousin",
  "Niece",
  "Nephew",
  "In-law",
  "Friend",
] as const;
