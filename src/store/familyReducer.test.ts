import { describe, expect, it } from "vitest";
import { createInitialState } from "../data/mockFamily";
import { createMember } from "../lib/members";
import { familyReducer } from "./familyReducer";

describe("familyReducer", () => {
  it("adds, updates, removes, and resets members without sharing the seed", () => {
    const initial = createInitialState();
    const added = createMember(initial.group.id, {
      firstName: "Sample",
      lastName: "Relative",
      relationship: "Friend",
      dateOfBirth: "2020-09-24",
      phone: null,
      email: null,
      address: null,
      notes: "",
    });

    const withMember = familyReducer(initial, { type: "add", member: added });
    expect(withMember.members).toHaveLength(initial.members.length + 1);
    expect(initial.members).toHaveLength(11);

    const updated = familyReducer(withMember, {
      type: "update",
      id: added.id,
      patch: { relationship: "Neighbor" },
      updatedAt: "2026-09-21T12:00:00.000Z",
    });
    expect(updated.members.find((member) => member.id === added.id)?.relationship).toBe("Neighbor");

    const removed = familyReducer(updated, { type: "remove", id: added.id });
    expect(removed.members.find((member) => member.id === added.id)).toBeUndefined();

    const missing = familyReducer(removed, { type: "remove", id: "mem_missing" });
    expect(missing).toBe(removed);

    const reset = familyReducer(removed, { type: "reset" });
    expect(reset.members.map((member) => member.id)).toEqual(createInitialState().members.map((member) => member.id));
    expect(reset).not.toBe(initial);
  });

  it("clones the mock household on each initial state", () => {
    const first = createInitialState();
    first.members[0].fullName = "Changed";
    first.group.name = "Changed";
    const second = createInitialState();
    expect(second.members[0].fullName).toBe("Elena Harper");
    expect(second.group.name).toBe("The Harpers");
  });
});
