import { describe, expect, it } from "vitest";
import { createMember } from "../lib/members";
import { addressToInsert, ensureMemberIds, groupFromRow, memberFromRow, memberToInsert, normalizeInviteCode, userFromRow } from "./rows";

describe("household rows", () => {
  it("maps a member and an Irish address in both directions", () => {
    const member = ensureMemberIds(
      createMember("group-1", {
        firstName: "Aoife",
        lastName: "Murphy",
        relationship: "Cousin",
        dateOfBirth: "1990-03-15",
        phone: null,
        email: "aoife@example.com",
        notes: "Malahide",
        address: {
          format: "ie",
          line1: "12 Main Street",
          line2: "",
          line3: "",
          city: "Malahide",
          region: "Dublin",
          postalCode: "K36 AB12",
          country: "Ireland",
          verified: false,
        },
      }),
    );

    const insert = memberToInsert(member);
    expect(insert.first_name).toBe("Aoife");
    expect(insert.family_group_id).toBe("group-1");
    expect(member.address).not.toBeNull();
    if (!member.address) return;
    expect(addressToInsert(member.address, member.id).postal_code).toBe("K36 AB12");

    const restored = memberFromRow({
      ...insert,
      addresses: [{ ...addressToInsert(member.address, member.id), format: "ie" }],
    });
    expect(insert.photo_path).toBeNull();
    expect(insert).not.toHaveProperty("photoUrl");
    expect(restored).toMatchObject({
      firstName: "Aoife",
      dateOfBirth: "1990-03-15",
      photoPath: null,
      photoUrl: null,
      address: { format: "ie", city: "Malahide", postalCode: "K36 AB12", verified: false },
    });
  });

  it("keeps a picture path on the row and drops the signed url", () => {
    const member = ensureMemberIds(
      createMember("2b6d9c10-7a4e-4f1b-9c2d-3e5f7a8b9c01", {
        firstName: "Aoife",
        lastName: "Murphy",
        relationship: "",
        dateOfBirth: null,
        phone: null,
        email: null,
        notes: "",
        address: null,
      }),
    );
    const pictured = { ...member, photoPath: `${member.familyGroupId}/${member.id}.jpg`, photoUrl: "https://example.test/signed" };
    const insert = memberToInsert(pictured);
    expect(insert.photo_path).toBe(pictured.photoPath);
    expect(insert).not.toHaveProperty("photoUrl");
    expect(memberFromRow({ ...insert, addresses: null }).photoPath).toBe(pictured.photoPath);
    expect(memberFromRow({ ...insert, photo_path: "  ", addresses: null }).photoPath).toBeNull();
  });

  it("reads a missing address and a date-only birthday", () => {
    const member = memberFromRow({
      id: "8d1c6e2a-1f4b-4a1e-8c3d-6b7a9e0f1234",
      family_group_id: "2b6d9c10-7a4e-4f1b-9c2d-3e5f7a8b9c01",
      first_name: "Sam",
      last_name: "Walsh",
      full_name: "Sam Walsh",
      relationship: "",
      date_of_birth: "2020-06-05T00:00:00",
      phone: null,
      email: null,
      notes: "",
      linked_user_id: null,
      created_at: "2026-09-22T12:00:00.000Z",
      updated_at: "2026-09-22T12:00:00.000Z",
      addresses: null,
    });
    expect(member.dateOfBirth).toBe("2020-06-05");
    expect(member.address).toBeNull();
    expect(member.photoPath).toBeNull();
    expect(member.photoUrl).toBeNull();
  });

  it("maps the household and the signed-in people", () => {
    expect(
      groupFromRow({
        id: "2b6d9c10-7a4e-4f1b-9c2d-3e5f7a8b9c01",
        name: "The Murphys",
        description: null,
        invite_code: "MURA-7K2P",
        created_at: "2026-09-22T12:00:00.000Z",
        updated_at: "2026-09-22T12:00:00.000Z",
      }),
    ).toMatchObject({ name: "The Murphys", description: "", inviteCode: "MURA-7K2P" });

    expect(
      userFromRow({
        user_id: "5c1e8a44-6d2b-4e8f-9a10-11b2c3d4e5f6",
        display_name: "Aoife",
        email: "aoife@example.com",
        role: "editor",
        joined_at: "2026-09-22T12:00:00.000Z",
      }).role,
    ).toBe("editor");
  });

  it("normalizes invite codes typed with spaces or a missing dash", () => {
    expect(normalizeInviteCode(" mura-7k2p ")).toBe("MURA7K2P");
    expect(normalizeInviteCode("MURA7K2P")).toBe("MURA7K2P");
  });
});
