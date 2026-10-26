import type { Address, AddressFormat, FamilyGroup, FamilyUser, Godparent, Member, MemberRelation, RelationKind } from "../types";

export interface FamilyGroupRow {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyUserRow {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface AddressRow {
  id: string;
  format: string;
  line1: string;
  line2: string;
  line3: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  verified: boolean;
}

export interface MemberRow {
  id: string;
  family_group_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  relationship: string;
  /** Absent on rows loaded before the gender column existed. */
  gender?: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  notes: string;
  linked_user_id: string | null;
  /** Absent on rows loaded before the picture column existed. */
  photo_path?: string | null;
  created_at: string;
  updated_at: string;
  addresses: AddressRow | AddressRow[] | null;
}

export interface MemberInsert {
  id: string;
  family_group_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  relationship: string;
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  notes: string;
  linked_user_id: string | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddressInsert {
  id: string;
  member_id: string;
  format: AddressFormat;
  line1: string;
  line2: string;
  line3: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  verified: boolean;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function ensureMemberIds(member: Member): Member {
  return {
    ...member,
    id: isUuid(member.id) ? member.id : crypto.randomUUID(),
    address: member.address
      ? { ...member.address, id: isUuid(member.address.id) ? member.address.id : crypto.randomUUID() }
      : null,
  };
}

export function normalizeInviteCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function groupFromRow(row: FamilyGroupRow): FamilyGroup {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    inviteCode: row.invite_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function userFromRow(row: FamilyUserRow): FamilyUser {
  return {
    id: row.user_id,
    displayName: row.display_name,
    email: row.email,
    role: row.role === "owner" ? "owner" : "editor",
    joinedAt: row.joined_at,
  };
}

export function memberFromRow(row: MemberRow): Member {
  const address = firstAddress(row.addresses);
  return {
    id: row.id,
    familyGroupId: row.family_group_id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    relationship: row.relationship,
    gender: row.gender === "female" || row.gender === "male" ? row.gender : null,
    dateOfBirth: row.date_of_birth ? row.date_of_birth.slice(0, 10) : null,
    phone: row.phone,
    email: row.email,
    address: address ? addressFromRow(address) : null,
    notes: row.notes,
    linkedUserId: row.linked_user_id,
    photoPath: row.photo_path?.trim() ? row.photo_path.trim() : null,
    photoUrl: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function memberToInsert(member: Member): MemberInsert {
  return {
    id: member.id,
    family_group_id: member.familyGroupId,
    first_name: member.firstName,
    last_name: member.lastName,
    full_name: member.fullName,
    relationship: member.relationship,
    gender: member.gender,
    date_of_birth: member.dateOfBirth,
    phone: member.phone,
    email: member.email,
    notes: member.notes,
    linked_user_id: member.linkedUserId,
    photo_path: member.photoPath,
    created_at: member.createdAt,
    updated_at: member.updatedAt,
  };
}

export function addressToInsert(address: Address, memberId: string): AddressInsert {
  return {
    id: address.id,
    member_id: memberId,
    format: address.format,
    line1: address.line1,
    line2: address.line2,
    line3: address.line3,
    city: address.city,
    region: address.region,
    postal_code: address.postalCode,
    country: address.country,
    verified: address.verified,
  };
}

export function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function firstAddress(value: AddressRow | AddressRow[] | null): AddressRow | null {
  return firstRelation(value);
}

export interface RelationRow {
  id: string;
  family_group_id: string;
  from_member_id: string;
  to_member_id: string;
  kind: string;
  wedding_date?: string | null;
}

export interface GodparentRow {
  id: string;
  family_group_id: string;
  member_id: string;
  slot: number;
  godparent_member_id: string | null;
  godparent_name: string | null;
}

export function relationFromRow(row: RelationRow): MemberRelation | null {
  if (row.kind !== "parent" && row.kind !== "spouse" && row.kind !== "sibling") return null;
  const kind: RelationKind = row.kind;
  const weddingDate = kind === "spouse" && row.wedding_date ? row.wedding_date.slice(0, 10) : null;
  return {
    id: row.id,
    familyGroupId: row.family_group_id,
    fromMemberId: row.from_member_id,
    toMemberId: row.to_member_id,
    kind,
    weddingDate,
  };
}

export function relationToInsert(relation: MemberRelation): {
  id: string;
  family_group_id: string;
  from_member_id: string;
  to_member_id: string;
  kind: RelationKind;
  wedding_date: string | null;
} {
  return {
    id: relation.id,
    family_group_id: relation.familyGroupId,
    from_member_id: relation.fromMemberId,
    to_member_id: relation.toMemberId,
    kind: relation.kind,
    wedding_date: relation.kind === "spouse" ? relation.weddingDate : null,
  };
}

export function godparentFromRow(row: GodparentRow): Godparent | null {
  if (row.slot !== 1 && row.slot !== 2) return null;
  const name = row.godparent_name?.trim() ?? "";
  if (!row.godparent_member_id && !name) return null;
  return {
    id: row.id,
    familyGroupId: row.family_group_id,
    memberId: row.member_id,
    slot: row.slot,
    godparentMemberId: row.godparent_member_id,
    godparentName: name,
  };
}

export function godparentToInsert(godparent: Godparent): {
  id: string;
  family_group_id: string;
  member_id: string;
  slot: 1 | 2;
  godparent_member_id: string | null;
  godparent_name: string;
} {
  return {
    id: godparent.id,
    family_group_id: godparent.familyGroupId,
    member_id: godparent.memberId,
    slot: godparent.slot,
    godparent_member_id: godparent.godparentMemberId,
    godparent_name: godparent.godparentName,
  };
}

function addressFromRow(row: AddressRow): Address {
  const format: AddressFormat = row.format === "international" ? "international" : "ie";
  return {
    id: row.id,
    format,
    line1: row.line1,
    line2: row.line2,
    line3: row.line3,
    city: row.city,
    region: row.region,
    postalCode: row.postal_code,
    country: row.country,
    verified: row.verified,
  };
}
