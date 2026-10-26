import type { Session, User } from "@supabase/supabase-js";
import { memberPhotoBlob, MEMBER_PHOTO_BUCKET, photoObjectPath, photoProblem, STORED_PHOTO_MAX_BYTES } from "../lib/memberPhoto";
import { nativeSignUpRedirect } from "../native/authLink";
import type { FamilyState, Godparent, Member, MemberRelation } from "../types";
import { getSupabase } from "./client";
import { friendlySupabaseMessage } from "./messages";
import {
  addressToInsert,
  firstRelation,
  groupFromRow,
  memberFromRow,
  memberToInsert,
  godparentFromRow,
  godparentToInsert,
  relationFromRow,
  relationToInsert,
  userFromRow,
  type FamilyGroupRow,
  type FamilyUserRow,
  type MemberRow,
  type GodparentRow,
  type RelationRow,
} from "./rows";

export type SignUpResult = "signed-in" | "confirm-email" | "exists";

export function supabaseFailure(error: { message: string; code?: string }): Error {
  return new Error(friendlySupabaseMessage(error.message, error.code));
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw supabaseFailure(error);
}

export async function signUp(displayName: string, email: string, password: string): Promise<SignUpResult> {
  const emailRedirectTo = nativeSignUpRedirect();
  const { data, error } = await getSupabase().auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { display_name: displayName.trim() },
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
    },
  });
  if (error) throw supabaseFailure(error);
  if (data.user && (data.user.identities?.length ?? 0) === 0) return "exists";
  if (!data.session) return "confirm-email";
  return "signed-in";
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw supabaseFailure(error);
}

export async function createFamilyGroup(name: string, description: string): Promise<void> {
  const { error } = await getSupabase().rpc("create_family_group", {
    household_name: name.trim(),
    household_description: description.trim(),
  });
  if (error) throw supabaseFailure(error);
}

export async function joinFamilyGroup(inviteCode: string): Promise<void> {
  const { error } = await getSupabase().rpc("join_family_group", { invite_code: inviteCode.trim() });
  if (error) throw supabaseFailure(error);
}

export async function loadFamily(user: User): Promise<FamilyState | null> {
  const supabase = getSupabase();
  const { data: membership, error } = await supabase
    .from("family_users")
    .select("user_id, display_name, email, role, joined_at, family_groups(id, name, description, invite_code, created_at, updated_at)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw supabaseFailure(error);
  if (!membership) return null;

  const group = firstRelation(membership.family_groups as FamilyGroupRow | FamilyGroupRow[] | null);
  if (!group) throw new Error("This account is missing its household.");

  const [{ data: people, error: peopleError }, { data: members, error: membersError }, { data: relations, error: relationsError }, { data: godparents, error: godparentsError }] =
    await Promise.all([
      supabase.from("family_users").select("user_id, display_name, email, role, joined_at").eq("family_group_id", group.id).order("joined_at"),
      supabase.from("members").select("*, addresses(*)").eq("family_group_id", group.id).order("last_name").order("first_name"),
      supabase.from("member_relations").select("id, family_group_id, from_member_id, to_member_id, kind, wedding_date").eq("family_group_id", group.id),
      supabase.from("godparents").select("id, family_group_id, member_id, slot, godparent_member_id, godparent_name").eq("family_group_id", group.id),
    ]);
  if (peopleError) throw supabaseFailure(peopleError);
  if (membersError) throw supabaseFailure(membersError);
  if (relationsError) throw supabaseFailure(relationsError);
  if (godparentsError) throw supabaseFailure(godparentsError);

  return {
    group: groupFromRow(group),
    people: ((people ?? []) as FamilyUserRow[]).map(userFromRow),
    currentUserId: user.id,
    members: await withMemberPhotoUrls(((members ?? []) as MemberRow[]).map(memberFromRow)),
    relations: ((relations ?? []) as RelationRow[]).flatMap((row) => {
      const relation = relationFromRow(row);
      return relation ? [relation] : [];
    }),
    godparents: ((godparents ?? []) as GodparentRow[]).flatMap((row) => {
      const godparent = godparentFromRow(row);
      return godparent ? [godparent] : [];
    }),
  };
}

const PHOTO_URL_SECONDS = 60 * 60;

export async function withMemberPhotoUrls(members: readonly Member[]): Promise<Member[]> {
  const paths = [...new Set(members.flatMap((member) => (member.photoPath ? [member.photoPath] : [])))];
  if (paths.length === 0) return [...members];

  try {
    const urls = new Map<string, string>();
    for (let index = 0; index < paths.length; index += 100) {
      const batch = paths.slice(index, index + 100);
      const { data, error } = await getSupabase().storage.from(MEMBER_PHOTO_BUCKET).createSignedUrls(batch, PHOTO_URL_SECONDS);
      if (error || !data) continue;
      for (const item of data) {
        if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl);
      }
    }
    return members.map((member) => {
      const photoUrl = member.photoPath ? (urls.get(member.photoPath) ?? null) : null;
      return photoUrl ? { ...member, photoUrl } : member;
    });
  } catch {
    return [...members];
  }
}

export async function storeMemberPhoto(familyGroupId: string, memberId: string, file: File): Promise<{ photoPath: string; photoUrl: string | null }> {
  const problem = photoProblem(file);
  if (problem) throw new Error(problem);

  const blob = await memberPhotoBlob(file).catch(() => {
    throw new Error("This picture could not be prepared.");
  });
  if (blob.size > STORED_PHOTO_MAX_BYTES) {
    throw new Error("That picture is still too large after resizing. Choose a smaller one.");
  }

  const photoPath = photoObjectPath(familyGroupId, memberId);
  const { error } = await getSupabase().storage.from(MEMBER_PHOTO_BUCKET).upload(photoPath, blob, {
    contentType: "image/jpeg",
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw supabaseFailure(error);

  return { photoPath, photoUrl: await signedPhotoUrl(photoPath) };
}

export async function discardMemberPhoto(path: string | null): Promise<void> {
  if (!path) return;
  const { error } = await getSupabase().storage.from(MEMBER_PHOTO_BUCKET).remove([path]);
  if (error && !/not found/i.test(error.message)) throw supabaseFailure(error);
}

async function signedPhotoUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await getSupabase().storage.from(MEMBER_PHOTO_BUCKET).createSignedUrl(path, PHOTO_URL_SECONDS);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function insertMembers(members: readonly Member[]): Promise<void> {
  if (members.length === 0) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("members").insert(members.map(memberToInsert));
  if (error) throw supabaseFailure(error);

  const addresses = members.flatMap((member) => (member.address ? [addressToInsert(member.address, member.id)] : []));
  if (addresses.length === 0) return;
  const { error: addressError } = await supabase.from("addresses").insert(addresses);
  if (addressError) throw supabaseFailure(addressError);
}

export async function updateStoredMember(member: Member): Promise<void> {
  const supabase = getSupabase();
  const { id, created_at: createdAt, ...fields } = memberToInsert(member);
  void createdAt;
  const { error } = await supabase.from("members").update(fields).eq("id", id);
  if (error) throw supabaseFailure(error);

  if (!member.address) {
    const { error: deleteError } = await supabase.from("addresses").delete().eq("member_id", member.id);
    if (deleteError) throw supabaseFailure(deleteError);
    return;
  }

  const { error: addressError } = await supabase.from("addresses").upsert(addressToInsert(member.address, member.id), { onConflict: "member_id" });
  if (addressError) throw supabaseFailure(addressError);
}

export async function insertRelations(relations: readonly MemberRelation[]): Promise<void> {
  if (relations.length === 0) return;
  const { error } = await getSupabase().from("member_relations").insert(relations.map(relationToInsert));
  if (error) throw supabaseFailure(error);
}

export async function replaceMemberRelations(memberId: string, relations: readonly MemberRelation[]): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("member_relations").delete().or(`from_member_id.eq.${memberId},to_member_id.eq.${memberId}`);
  if (error) throw supabaseFailure(error);
  await insertRelations(relations.filter((relation) => relation.fromMemberId === memberId || relation.toMemberId === memberId));
}

export async function replaceMemberGodparents(memberId: string, godparents: readonly Godparent[]): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("godparents").delete().eq("member_id", memberId);
  if (error) throw supabaseFailure(error);
  if (godparents.length === 0) return;
  const { error: insertError } = await supabase.from("godparents").insert(godparents.map(godparentToInsert));
  if (insertError) throw supabaseFailure(insertError);
}

export async function updateOwnDisplayName(userId: string, displayName: string): Promise<void> {
  const name = displayName.trim().slice(0, 80);
  if (!name) return;
  const { error } = await getSupabase().from("family_users").update({ display_name: name }).eq("user_id", userId);
  if (error) throw supabaseFailure(error);
}

export async function deleteStoredMember(id: string): Promise<void> {
  const { error } = await getSupabase().from("members").delete().eq("id", id);
  if (error) throw supabaseFailure(error);
}

export function sessionEmail(session: Session): string {
  return session.user.email ?? "";
}
