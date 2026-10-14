import { createInitialState } from "../data/mockFamily";
import { mergeMember } from "../lib/members";
import type { FamilyState, Member, MemberPatch } from "../types";

export type FamilyAction =
  | { type: "add"; member: Member }
  | { type: "import"; members: Member[] }
  | { type: "update"; id: string; patch: MemberPatch; updatedAt: string }
  | { type: "remove"; id: string }
  | { type: "reset" };

export function familyReducer(state: FamilyState, action: FamilyAction): FamilyState {
  switch (action.type) {
    case "add":
      return { ...state, members: [...state.members, action.member] };
    case "import":
      if (action.members.length === 0) return state;
      return { ...state, members: [...state.members, ...action.members] };
    case "update": {
      let changed = false;
      const members = state.members.map((member) => {
        if (member.id !== action.id) return member;
        changed = true;
        return mergeMember(member, action.patch, action.updatedAt);
      });
      return changed ? { ...state, members } : state;
    }
    case "remove": {
      const members = state.members.filter((member) => member.id !== action.id);
      if (members.length === state.members.length) return state;
      return {
        ...state,
        members,
        relations: state.relations.filter((relation) => relation.fromMemberId !== action.id && relation.toMemberId !== action.id),
      };
    }
    case "reset":
      return createInitialState();
    default:
      return state;
  }
}
