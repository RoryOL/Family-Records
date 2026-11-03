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

/** Used to choose niece or nephew, brother or sister, and the other paired terms. */
export type Gender = "female" | "male";

/** Stored link. Parent and step point from the elder to the child. Partner, marriage, and sibling links are stored once. */
export type RelationKind = "parent" | "step" | "spouse" | "married" | "sibling";

/** How the person being edited is related to someone already in the household. */
export type LinkRole = "parent" | "child" | "stepparent" | "stepchild" | "sibling" | "spouse" | "married";

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
  gender: Gender | null;
  dateOfBirth: IsoDate | null;
  /** True when the household has recorded that this person has died. A date of death implies this. */
  deceased: boolean;
  dateOfDeath: IsoDate | null;
  phone: string | null;
  email: string | null;
  address: Address | null;
  notes: string;
  /** Auth user linked to this profile, when this person can sign in. */
  linkedUserId: string | null;
  /** Object path in the private member-photos bucket, or null when this person has no picture. */
  photoPath: string | null;
  /** Short-lived signed URL for display. This is not written back to the database. */
  photoUrl: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface MemberDraft {
  firstName: string;
  lastName: string;
  fullName?: string;
  relationship: string;
  gender?: Gender | null;
  dateOfBirth: IsoDate | null;
  deceased?: boolean;
  dateOfDeath?: IsoDate | null;
  phone: string | null;
  email: string | null;
  address: AddressInput | null;
  notes: string;
}

export type MemberPatch = Partial<MemberDraft>;

export interface MemberRelation {
  id: string;
  familyGroupId: string;
  fromMemberId: string;
  toMemberId: string;
  kind: RelationKind;
  /** Set only on a marriage. Partner links do not keep a date. */
  weddingDate: IsoDate | null;
}

/** One row in the member form: this person is the parent, child, sibling, partner, or spouse of someone else. */
export interface MemberLinkInput {
  otherId: string;
  role: LinkRole;
  /** Marriage date. Used only when the role is married. */
  weddingDate?: string;
}

/** One of the two godparent places on a person. A household member, or a name for someone who is not listed. */
export interface Godparent {
  id: string;
  familyGroupId: string;
  memberId: string;
  slot: 1 | 2;
  godparentMemberId: string | null;
  godparentName: string;
}

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
  relations: MemberRelation[];
  godparents: Godparent[];
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
  | "dateOfDeath"
  | "deceased"
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
