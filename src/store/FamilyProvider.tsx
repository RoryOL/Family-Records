import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthPage } from "../auth/AuthPage";
import { GateFrame } from "../auth/GateFrame";
import { primaryButtonClass } from "../directory/styles";
import { HouseholdPage } from "../auth/HouseholdPage";
import { SetupPage } from "../auth/SetupPage";
import { harperLinkPlan, sampleMemberDrafts } from "../data/mockFamily";
import { godparentsFromSlots, replaceGodparentRows, type GodparentSlot } from "../lib/godparents";
import { applyMemberLinks, makeRelation } from "../lib/kinship";
import type { MemberPhotoSelection } from "../lib/memberPhoto";
import { createMember, mergeMember } from "../lib/members";
import { getSupabase, supabaseConfig } from "../supabase/client";
import {
  createFamilyGroup,
  deleteStoredMember,
  discardMemberPhoto,
  insertMembers,
  insertRelations,
  joinFamilyGroup,
  loadFamily,
  replaceMemberGodparents,
  replaceMemberRelations,
  signOut as endSession,
  updateOwnDisplayName,
  storeMemberPhoto,
  updateStoredMember,
} from "../supabase/familyApi";
import { friendlySupabaseMessage } from "../supabase/messages";
import { ensureMemberIds } from "../supabase/rows";
import { familyReducer } from "./familyReducer";
import type { FamilyState, FamilyUser, Member, MemberDraft, MemberLinkInput, MemberPatch } from "../types";

export interface FamilyContextValue {
  group: FamilyState["group"];
  people: FamilyUser[];
  currentUser: FamilyUser;
  members: Member[];
  relations: FamilyState["relations"];
  godparents: FamilyState["godparents"];
  getMember: (id: string) => Member | undefined;
  addMember: (draft: MemberDraft, photo?: File | null, links?: readonly MemberLinkInput[], godparents?: readonly GodparentSlot[]) => Promise<Member>;
  importMembers: (drafts: readonly MemberDraft[]) => Promise<Member[]>;
  addSampleHousehold: () => Promise<void>;
  updateMember: (id: string, patch: MemberPatch, photo?: MemberPhotoSelection, links?: readonly MemberLinkInput[], godparents?: readonly GodparentSlot[]) => Promise<void>;
  saveOwnDetails: (draft: MemberDraft, photo?: MemberPhotoSelection, links?: readonly MemberLinkInput[], godparents?: readonly GodparentSlot[]) => Promise<Member>;
  removeMember: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
}

type Phase = "loading" | "unconfigured" | "signed-out" | "needs-household" | "ready" | "error";

const FamilyContext = createContext<FamilyContextValue | null>(null);
const configured = supabaseConfig() !== null;

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<Phase>(configured ? "loading" : "unconfigured");
  const [state, setState] = useState<FamilyState | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const seenUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabase();
    let active = true;
    seenUserId.current = null;

    function apply(next: Session | null) {
      if (!active) return;
      const userId = next?.user.id ?? null;
      setSession(next);
      if (userId && userId === seenUserId.current) return;
      seenUserId.current = userId;
      if (!next) {
        setState(null);
        setPhase("signed-out");
        return;
      }

      setPhase("loading");
      void loadFamily(next.user)
        .then((family) => {
          if (!active) return;
          setState(family);
          setGateError(null);
          setPhase(family ? "ready" : "needs-household");
        })
        .catch((error: unknown) => {
          if (!active) return;
          setGateError(error instanceof Error ? error.message : "The household could not be opened.");
          setPhase("error");
        });
    }

    void supabase.auth.getSession().then(({ data: sessionData, error }) => {
      if (!active) return;
      if (error) {
        setGateError(friendlySupabaseMessage(error.message));
        setPhase("error");
        return;
      }
      apply(sessionData.session);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      apply(next);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [attempt]);

  const groupId = state?.group.id ?? null;
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    if (phase !== "ready" || !groupId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reload = () => {
      const current = sessionRef.current;
      if (!current || document.querySelector("dialog[open]")) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        void loadFamily(current.user)
          .then((family) => {
            if (family && family.group.id === groupId) setState(family);
          })
          .catch(() => undefined);
      }, 250);
    };
    window.addEventListener("focus", reload);
    const channel = getSupabase()
      .channel(`household-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "addresses" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "family_users" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "member_relations" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "godparents" }, reload)
      .subscribe();
    return () => {
      window.removeEventListener("focus", reload);
      clearTimeout(timer);
      void getSupabase().removeChannel(channel);
    };
  }, [phase, groupId]);

  const value = useMemo<FamilyContextValue | null>(() => {
    if (!state) return null;
    const currentUser = state.people.find((person) => person.id === state.currentUserId);
    if (!currentUser) return null;

    return {
      group: state.group,
      people: state.people,
      currentUser,
      members: state.members,
      relations: state.relations,
      godparents: state.godparents,
      getMember(id) {
        return state.members.find((member) => member.id === id);
      },
      async addMember(draft, photo, links = [], godparentSlots = []) {
        const created = ensureMemberIds(createMember(state.group.id, draft));
        const member = photo ? await memberWithPhoto(created, photo) : created;
        const relations = applyMemberLinks(state.relations, state.group.id, member.id, links);
        const addedGodparents = godparentsFromSlots(state.group.id, member.id, godparentSlots, state.members);
        try {
          await insertMembers([member]);
          await replaceMemberRelations(member.id, relations);
          await replaceMemberGodparents(member.id, addedGodparents);
        } catch (error) {
          if (member.photoPath) await discardMemberPhoto(member.photoPath).catch(() => undefined);
          throw error;
        }
        const godparents = replaceGodparentRows(state.godparents, member.id, addedGodparents);
        setState({ ...familyReducer(state, { type: "add", member }), relations, godparents });
        return member;
      },
      async importMembers(drafts) {
        const members = drafts.map((draft) => ensureMemberIds(createMember(state.group.id, draft)));
        await insertMembers(members);
        setState(familyReducer(state, { type: "import", members }));
        return members;
      },
      async addSampleHousehold() {
        const members = sampleMemberDrafts().map((draft) => ensureMemberIds(createMember(state.group.id, draft)));
        const byName = new Map(members.map((member) => [member.fullName, member.id]));
        const relations = harperLinkPlan().flatMap((link) => {
          const from = byName.get(link.fromName);
          const to = byName.get(link.toName);
          if (!from || !to) return [];
          const relation = makeRelation(state.group.id, from, to, link.kind, link.weddingDate ?? null);
          return relation ? [relation] : [];
        });
        const people = members.map((member) => ({ id: member.id, fullName: member.fullName }));
        const jonahId = byName.get("Jonah Harper") ?? "";
        const willaId = byName.get("Willa Harper") ?? "";
        const sampleGodparents = [
          ...godparentsFromSlots(state.group.id, jonahId, [{ choice: byName.get("Ruth Ellison") ?? "", name: "" }, { choice: "", name: "" }], people),
          ...godparentsFromSlots(state.group.id, willaId, [{ choice: "name", name: "Patrick Murphy" }, { choice: "", name: "" }], people),
        ].filter((row) => row.memberId);
        await insertMembers(members);
        await insertRelations(relations);
        if (jonahId) await replaceMemberGodparents(jonahId, sampleGodparents.filter((row) => row.memberId === jonahId));
        if (willaId) await replaceMemberGodparents(willaId, sampleGodparents.filter((row) => row.memberId === willaId));
        setState({
          ...familyReducer(state, { type: "import", members }),
          relations: [...state.relations, ...relations],
          godparents: [...state.godparents, ...sampleGodparents],
        });
      },
      async updateMember(id, patch, photo, links, godparentSlots) {
        const existing = state.members.find((member) => member.id === id);
        if (!existing) return;
        let member = ensureMemberIds(mergeMember(existing, patch, new Date().toISOString()));
        if (photo?.file) {
          member = await memberWithPhoto(member, photo.file);
        } else if (photo?.remove) {
          member = { ...member, photoPath: null, photoUrl: null };
        }
        const relations = links ? applyMemberLinks(state.relations, state.group.id, member.id, links) : state.relations;
        const godparents = godparentSlots
          ? replaceGodparentRows(state.godparents, member.id, godparentsFromSlots(state.group.id, member.id, godparentSlots, state.members))
          : state.godparents;
        await updateStoredMember(member);
        if (links) await replaceMemberRelations(member.id, relations);
        if (godparentSlots) await replaceMemberGodparents(member.id, godparents.filter((row) => row.memberId === member.id));
        if (photo?.remove && existing.photoPath && !photo.file) {
          await discardMemberPhoto(existing.photoPath).catch(() => undefined);
        }
        setState({ ...state, members: state.members.map((item) => (item.id === id ? member : item)), relations, godparents });
      },
      async saveOwnDetails(draft, photo, links = [], godparentSlots = []) {
        const existing = state.members.find((member) => member.linkedUserId === state.currentUserId);
        const labeled = existing ? draft : { ...draft, relationship: draft.relationship.trim() || "Self" };
        if (!existing) {
          let member: Member = { ...ensureMemberIds(createMember(state.group.id, labeled)), linkedUserId: state.currentUserId };
          if (photo?.file) member = await memberWithPhoto(member, photo.file);
          const relations = applyMemberLinks(state.relations, state.group.id, member.id, links);
          const ownGodparents = godparentsFromSlots(state.group.id, member.id, godparentSlots, state.members);
          try {
            await insertMembers([member]);
            await replaceMemberRelations(member.id, relations);
            await replaceMemberGodparents(member.id, ownGodparents);
          } catch (error) {
            if (member.photoPath) await discardMemberPhoto(member.photoPath).catch(() => undefined);
            throw error;
          }
          await rememberDisplayName(state.currentUserId, member.fullName);
          setState({
            ...familyReducer(state, { type: "add", member }),
            relations,
            godparents: replaceGodparentRows(state.godparents, member.id, ownGodparents),
            people: namedPeople(state.people, state.currentUserId, member.fullName),
          });
          return member;
        }

        let member = ensureMemberIds(mergeMember(existing, labeled, new Date().toISOString()));
        if (photo?.file) {
          member = await memberWithPhoto(member, photo.file);
        } else if (photo?.remove) {
          member = { ...member, photoPath: null, photoUrl: null };
        }
        const relations = applyMemberLinks(state.relations, state.group.id, member.id, links);
        const ownGodparents = godparentsFromSlots(state.group.id, member.id, godparentSlots, state.members);
        await updateStoredMember(member);
        await replaceMemberRelations(member.id, relations);
        await replaceMemberGodparents(member.id, ownGodparents);
        if (photo?.remove && existing.photoPath && !photo.file) {
          await discardMemberPhoto(existing.photoPath).catch(() => undefined);
        }
        await rememberDisplayName(state.currentUserId, member.fullName);
        setState({
          ...state,
          members: state.members.map((item) => (item.id === existing.id ? member : item)),
          relations,
          godparents: replaceGodparentRows(state.godparents, member.id, ownGodparents),
          people: namedPeople(state.people, state.currentUserId, member.fullName),
        });
        return member;
      },
      async removeMember(id) {
        const existing = state.members.find((member) => member.id === id);
        await deleteStoredMember(id);
        if (existing?.photoPath) await discardMemberPhoto(existing.photoPath).catch(() => undefined);
        setState(familyReducer(state, { type: "remove", id }));
      },
      async signOut() {
        seenUserId.current = null;
        await endSession();
      },
    };
  }, [state]);

  async function refreshHousehold() {
    if (!session) throw new Error("Sign in before opening a household.");
    const family = await loadFamily(session.user);
    if (!family) throw new Error("The household could not be opened.");
    setState(family);
    setPhase("ready");
  }

  if (phase === "unconfigured") return <SetupPage />;
  if (phase === "loading") return <GateFrame title="Family Records" lede="Opening your household…" />;
  if (phase === "error") {
    return (
      <GateFrame title="Family Records" lede={gateError ?? "The household could not be opened."}>
        <button type="button" className={`${primaryButtonClass} mt-8`} onClick={() => setAttempt((current) => current + 1)}>
          Try again
        </button>
      </GateFrame>
    );
  }
  if (phase === "signed-out") return <AuthPage />;
  if (phase === "needs-household") {
    return (
      <HouseholdPage
        email={session?.user.email ?? ""}
        onCreate={async (name, description) => {
          await createFamilyGroup(name, description);
          await refreshHousehold();
        }}
        onJoin={async (inviteCode) => {
          await joinFamilyGroup(inviteCode);
          await refreshHousehold();
        }}
        onSignOut={async () => {
          seenUserId.current = null;
          await endSession();
        }}
      />
    );
  }
  if (!value) return <GateFrame title="Family Records" lede="Opening your household…" />;

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

function namedPeople(people: FamilyUser[], userId: string, displayName: string): FamilyUser[] {
  return people.map((person) => (person.id === userId ? { ...person, displayName } : person));
}

async function rememberDisplayName(userId: string, displayName: string): Promise<void> {
  await updateOwnDisplayName(userId, displayName).catch(() => undefined);
}

async function memberWithPhoto(member: Member, file: File): Promise<Member> {
  const uploaded = await storeMemberPhoto(member.familyGroupId, member.id, file);
  return { ...member, photoPath: uploaded.photoPath, photoUrl: uploaded.photoUrl };
}

export function useFamily(): FamilyContextValue {
  const value = useContext(FamilyContext);
  if (!value) {
    throw new Error("useFamily must be used within FamilyProvider.");
  }
  return value;
}
