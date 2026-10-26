import type { Address, FamilyState, Gender, Member, MemberDraft, RelationKind } from "../types";

const SEEDED_AT = "2026-01-15T18:00:00.000Z";
const GROUP_ID = "grp_harpers";

/**
 * Birthdays are absolute dates. On 21 Sep 2026 they land in the
 * 7-, 30-, and 90-day windows so the preview can be checked by eye:
 * Samir today, Marcus in 2 days, Jonah in 5, Willa in 20,
 * Ruth in 42, Arthur in 88.
 */
function internationalAddress(address: Omit<Address, "format" | "line3">): Address {
  return { format: "international", line3: "", ...address };
}

function harperHome(id: string): Address {
  return internationalAddress({
    id,
    line1: "1842 Willow Lane",
    line2: "Apt 4",
    city: "Portland",
    region: "OR",
    postalCode: "97214",
    country: "United States",
    verified: true,
  });
}

function ellisonHome(id: string): Address {
  return internationalAddress({
    id,
    line1: "88 Cedar Court",
    line2: "",
    city: "Bend",
    region: "OR",
    postalCode: "97701",
    country: "United States",
    verified: true,
  });
}

function profile(fields: {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  gender?: Gender | null;
  dateOfBirth: string | null;
  phone: string | null;
  email: string | null;
  address: Address | null;
  notes: string;
  linkedUserId?: string | null;
}): Member {
  return {
    id: fields.id,
    familyGroupId: GROUP_ID,
    firstName: fields.firstName,
    lastName: fields.lastName,
    fullName: `${fields.firstName} ${fields.lastName}`,
    relationship: fields.relationship,
    gender: fields.gender ?? null,
    dateOfBirth: fields.dateOfBirth,
    deceased: false,
    dateOfDeath: null,
    phone: fields.phone,
    email: fields.email,
    address: fields.address,
    notes: fields.notes,
    linkedUserId: fields.linkedUserId ?? null,
    photoPath: null,
    photoUrl: null,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  };
}

export const mockFamily: FamilyState = {
  group: {
    id: GROUP_ID,
    name: "The Harpers",
    description: "Birthdays, addresses, and the people we keep close.",
    inviteCode: "HARPER-4F29",
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  },
  currentUserId: "usr_elena",
  people: [
    {
      id: "usr_elena",
      displayName: "Elena Harper",
      email: "elena@harper.example",
      role: "owner",
      joinedAt: SEEDED_AT,
    },
    {
      id: "usr_marcus",
      displayName: "Marcus Harper",
      email: "marcus@harper.example",
      role: "editor",
      joinedAt: "2026-02-02T16:00:00.000Z",
    },
  ],
  relations: [],
  godparents: [],
  members: [
    profile({
      id: "mem_elena",
      firstName: "Elena",
      lastName: "Harper",
      relationship: "Self",
      gender: "female",
      dateOfBirth: "1988-04-12",
      phone: "(503) 555-0142",
      email: "elena@harper.example",
      address: harperHome("adr_elena"),
      notes: "Keeps the family book. Prefers a call to a text.",
      linkedUserId: "usr_elena",
    }),
    profile({
      id: "mem_marcus",
      firstName: "Marcus",
      lastName: "Harper",
      relationship: "Spouse",
      gender: "male",
      dateOfBirth: "1986-09-23",
      phone: "(503) 555-0174",
      email: "marcus@harper.example",
      address: harperHome("adr_marcus"),
      notes: "Allergic to wool. Send cards to the Willow Lane address.",
      linkedUserId: "usr_marcus",
    }),
    profile({
      id: "mem_jonah",
      firstName: "Jonah",
      lastName: "Harper",
      relationship: "Child",
      gender: "male",
      dateOfBirth: "2016-09-26",
      phone: null,
      email: null,
      address: harperHome("adr_jonah"),
      notes: "Lives with Elena and Marcus.",
    }),
    profile({
      id: "mem_willa",
      firstName: "Willa",
      lastName: "Harper",
      relationship: "Child",
      gender: "female",
      dateOfBirth: "2019-10-11",
      phone: null,
      email: null,
      address: harperHome("adr_willa"),
      notes: "",
    }),
    profile({
      id: "mem_ruth",
      firstName: "Ruth",
      lastName: "Ellison",
      relationship: "Parent",
      gender: "female",
      dateOfBirth: "1958-11-02",
      phone: "(541) 555-0160",
      email: "ruth.ellison@example.com",
      address: ellisonHome("adr_ruth"),
      notes: "Elena's mother. Mail both holiday cards to Cedar Court.",
    }),
    profile({
      id: "mem_arthur",
      firstName: "Arthur",
      lastName: "Ellison",
      relationship: "Parent",
      gender: "male",
      dateOfBirth: "1956-12-18",
      phone: "(541) 555-0161",
      email: "arthur.ellison@example.com",
      address: ellisonHome("adr_arthur"),
      notes: "Elena's father.",
    }),
    profile({
      id: "mem_nora",
      firstName: "Nora",
      lastName: "Blake",
      relationship: "Sibling",
      gender: "female",
      dateOfBirth: "1991-01-19",
      phone: "(206) 555-0133",
      email: "nora.blake@example.com",
      address: internationalAddress({
        id: "adr_nora",
        line1: "901 Pine Street",
        line2: "Unit 12",
        city: "Seattle",
        region: "WA",
        postalCode: "98101",
        country: "United States",
        verified: true,
      }),
      notes: "Elena's sister. Uses Blake as her mailing name.",
    }),
    profile({
      id: "mem_samir",
      firstName: "Samir",
      lastName: "Shah",
      relationship: "Cousin",
      gender: "male",
      dateOfBirth: "1994-09-21",
      phone: "(415) 555-0188",
      email: "samir.shah@example.com",
      address: internationalAddress({
        id: "adr_samir",
        line1: "44 Clement Street",
        line2: "",
        city: "San Francisco",
        region: "CA",
        postalCode: "94118",
        country: "United States",
        verified: true,
      }),
      notes: "",
    }),
    profile({
      id: "mem_priya",
      firstName: "Priya",
      lastName: "Shah",
      relationship: "Cousin",
      gender: "female",
      dateOfBirth: null,
      phone: "(415) 555-0104",
      email: "priya.shah@example.com",
      address: internationalAddress({
        id: "adr_priya",
        line1: "12 Market Street",
        line2: "",
        city: "",
        region: "OR",
        postalCode: "",
        country: "United States",
        verified: false,
      }),
      notes: "Birthday unknown. Address is incomplete — do not mail yet.",
    }),
    profile({
      id: "mem_helen",
      firstName: "Helen",
      lastName: "Cho",
      relationship: "Aunt",
      gender: "female",
      dateOfBirth: "1962-08-30",
      phone: "(206) 555-0190",
      email: "helen.cho@example.com",
      address: internationalAddress({
        id: "adr_helen",
        line1: "415 Lake Street",
        line2: "",
        city: "Seattle",
        region: "WA",
        postalCode: "98102",
        country: "United States",
        verified: true,
      }),
      notes: "Marcus's aunt.",
    }),
    profile({
      id: "mem_chris",
      firstName: "Chris",
      lastName: "Patel",
      relationship: "Friend",
      dateOfBirth: "2001-03-14",
      phone: null,
      email: "chris.patel@example.com",
      address: null,
      notes: "No mailing address on file.",
    }),
  ],
};

/** Parent, partner, and sibling links for the Harper sample, matched by full name after import. */
export function harperLinkPlan(): { fromName: string; toName: string; kind: RelationKind; weddingDate?: string }[] {
  return [
    { fromName: "Arthur Ellison", toName: "Ruth Ellison", kind: "spouse", weddingDate: "1979-06-21" },
    { fromName: "Arthur Ellison", toName: "Elena Harper", kind: "parent" },
    { fromName: "Ruth Ellison", toName: "Elena Harper", kind: "parent" },
    { fromName: "Arthur Ellison", toName: "Nora Blake", kind: "parent" },
    { fromName: "Ruth Ellison", toName: "Nora Blake", kind: "parent" },
    { fromName: "Elena Harper", toName: "Marcus Harper", kind: "spouse", weddingDate: "2014-09-23" },
    { fromName: "Elena Harper", toName: "Jonah Harper", kind: "parent" },
    { fromName: "Marcus Harper", toName: "Jonah Harper", kind: "parent" },
    { fromName: "Elena Harper", toName: "Willa Harper", kind: "parent" },
    { fromName: "Marcus Harper", toName: "Willa Harper", kind: "parent" },
  ];
}

export function createInitialState(): FamilyState {
  return structuredClone(mockFamily);
}

/** Directory drafts for a new household that wants the Harper preview, without the sample login ids. */
export function sampleMemberDrafts(): MemberDraft[] {
  return createInitialState().members.map((member) => ({
    firstName: member.firstName,
    lastName: member.lastName,
    fullName: member.fullName,
    relationship: member.relationship,
    gender: member.gender,
    dateOfBirth: member.dateOfBirth,
    deceased: member.deceased,
    dateOfDeath: member.dateOfDeath,
    phone: member.phone,
    email: member.email,
    notes: member.notes,
    address: member.address
      ? {
          format: member.address.format,
          line1: member.address.line1,
          line2: member.address.line2,
          line3: member.address.line3,
          city: member.address.city,
          region: member.address.region,
          postalCode: member.address.postalCode,
          country: member.address.country,
          verified: member.address.verified,
        }
      : null,
  }));
}
