import { useEffect, useMemo } from "react";
import { focusMemberId, relationshipSummary } from "../lib/kinship";
import { pageClass } from "../directory/styles";
import { useFamily } from "../store/FamilyProvider";
import { FamilyTreeView } from "./FamilyTreeView";

export function FamilyTreePage() {
  const { group, members, relations, currentUser } = useFamily();
  const focusId = focusMemberId(members, currentUser.id);
  const people = useMemo(() => members.map((member) => ({ id: member.id, fullName: member.fullName, gender: member.gender })), [members]);

  useEffect(() => {
    document.title = `Family tree · ${group.name} · Family Records`;
  }, [group.name]);

  return (
    <main className={pageClass}>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">{group.name}</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Family tree</h1>
        <p className="mt-3 max-w-xl text-stone-500">Each row is a generation. The eldest person in a generation is on the left.</p>
      </header>
      <FamilyTreeView
        members={members}
        relations={relations}
        hrefFor={(id) => `/members/${encodeURIComponent(id)}`}
        labelFor={(member) => relationshipSummary({ id: member.id, fullName: member.fullName, gender: member.gender }, people, relations, focusId, member.relationship)}
      />
    </main>
  );
}
