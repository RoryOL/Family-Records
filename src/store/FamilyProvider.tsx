import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthPage } from "../auth/AuthPage";
import { GateFrame } from "../auth/GateFrame";
import { primaryButtonClass } from "../directory/styles";
import { HouseholdPage } from "../auth/HouseholdPage";
import { SetupPage } from "../auth/SetupPage";
import { harperLinkPlan, sampleMemberDrafts } from "../data/mockFamily";
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
  replaceMemberRelations,
  signOut as endSession,
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
  getMember: (id: string) => Member | undefined;
  addMember: (draft: MemberDraft, photo?: File | null, links?: readonly MemberLinkInput[]) => Promise<Member>;
  importMembers: (drafts: readonly MemberDraft[]) => Promise<Member[]>;
  addSampleHousehold: () => Promise<void>;
  updateMember: (id: string, patch: MemberPatch, photo?: MemberPhotoSelection, links?: readonly MemberLinkInput[]) => Promise<void>;
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
      getMember(id) {
        return state.members.find((member) => member.id === id);
      },
      async addMember(draft, photo, links = []) {
        const created = ensureMemberIds(createMember(state.group.id, draft));
        const member = photo ? await memberWithPhoto(created, photo) : created;
        const relations = applyMemberLinks(state.relations, state.group.id, member.id, links);
        try {
          await insertMembers([member]);
          await replaceMemberRelations(member.id, relations);
        } catch (error) {
          if (member.photoPath) await discardMemberPhoto(member.photoPath).catch(() => undefined);
          throw error;
        }
        setState({ ...familyReducer(state, { type: "add", member }), relations });
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
          const relation = makeRelation(state.group.id, from, to, link.kind);
          return relation ? [relation] : [];
        });
        await insertMembers(members);
        await insertRelations(relations);
        setState({ ...familyReducer(state, { type: "import", members }), relations: [...state.relations, ...relations] });
      },
      async updateMember(id, patch, photo, links) {
        const existing = state.members.find((member) => member.id === id);
        if (!existing) return;
        let member = ensureMemberIds(mergeMember(existing, patch, new Date().toISOString()));
        if (photo?.file) {
          member = await memberWithPhoto(member, photo.file);
        } else if (photo?.remove) {
          member = { ...member, photoPath: null, photoUrl: null };
        }
        const relations = links ? applyMemberLinks(state.relations, state.group.id, member.id, links) : state.relations;
        await updateStoredMember(member);
        if (links) await replaceMemberRelations(member.id, relations);
        if (photo?.remove && existing.photoPath && !photo.file) {
          await discardMemberPhoto(existing.photoPath).catch(() => undefined);
        }
        setState({ ...state, members: state.members.map((item) => (item.id === id ? member : item)), relations });
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
