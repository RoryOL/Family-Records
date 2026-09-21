import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { createInitialState } from "../data/mockFamily";
import { createMember } from "../lib/members";
import { familyReducer } from "./familyReducer";
import type { FamilyState, FamilyUser, Member, MemberDraft, MemberPatch } from "../types";

export interface FamilyContextValue {
  group: FamilyState["group"];
  people: FamilyUser[];
  currentUser: FamilyUser;
  members: Member[];
  getMember: (id: string) => Member | undefined;
  addMember: (draft: MemberDraft) => Member;
  updateMember: (id: string, patch: MemberPatch) => void;
  removeMember: (id: string) => void;
  reset: () => void;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(familyReducer, undefined, createInitialState);

  const value = useMemo<FamilyContextValue>(() => {
    const currentUser = state.people.find((person) => person.id === state.currentUserId);
    if (!currentUser) {
      throw new Error("The family store has no current user.");
    }

    return {
      group: state.group,
      people: state.people,
      currentUser,
      members: state.members,
      getMember(id) {
        return state.members.find((member) => member.id === id);
      },
      addMember(draft) {
        const member = createMember(state.group.id, draft);
        dispatch({ type: "add", member });
        return member;
      },
      updateMember(id, patch) {
        dispatch({ type: "update", id, patch, updatedAt: new Date().toISOString() });
      },
      removeMember(id) {
        dispatch({ type: "remove", id });
      },
      reset() {
        dispatch({ type: "reset" });
      },
    };
  }, [state]);

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily(): FamilyContextValue {
  const value = useContext(FamilyContext);
  if (!value) {
    throw new Error("useFamily must be used within FamilyProvider.");
  }
  return value;
}
