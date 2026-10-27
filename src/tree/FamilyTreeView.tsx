import { Link } from "react-router";
import { MemberAvatar } from "../directory/MemberAvatar";
import { lifeYearLabel } from "../directory/memberDisplay";
import { layoutFamilyTree, type TreeConnector } from "../lib/familyTree";
import type { Member, MemberRelation } from "../types";

const COLUMN = 176;

export function FamilyTreeView({
  members,
  relations,
  labelFor,
  hrefFor,
}: {
  members: readonly Member[];
  relations: readonly MemberRelation[];
  labelFor: (member: Member) => string;
  hrefFor: (id: string) => string;
}) {
  const layout = layoutFamilyTree(
    members.map((member) => ({ id: member.id, dateOfBirth: member.dateOfBirth })),
    relations,
  );
  const byId = new Map(members.map((member) => [member.id, member]));

  if (layout.components.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-sm text-stone-500">Add a parent, child, sibling, partner, or marriage on a profile to grow the tree.</p>
        <Unlinked members={members} ids={layout.unlinkedIds} hrefFor={hrefFor} />
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-12">
      {layout.components.map((component, index) => (
        <div key={component.rows[0]?.people[0]?.id ?? index} className="overflow-x-auto pb-2">
          <div style={{ width: component.columns * COLUMN }} className="mx-auto min-w-full">
            <ol className="grid gap-0">
              {component.rows.map((row, rowIndex) => {
                const nextConnectors = component.connectors.filter((connector) => connector.parentIds.every((id) => row.people.some((person) => person.id === id)));
                return (
                  <li key={row.generation}>
                    <h2 className="sr-only">Generation {row.generation + 1}</h2>
                    <div className="relative h-48">
                      {row.people.map((placed) => {
                        const member = byId.get(placed.id);
                        if (!member) return null;
                        const years = lifeYearLabel(member);
                        const label = labelFor(member);
                        return (
                          <div key={member.id} className="absolute top-0 px-2" style={{ left: placed.column * COLUMN, width: COLUMN }}>
                            <Link
                              to={hrefFor(member.id)}
                              className="mx-auto flex w-36 flex-col items-center rounded-3xl border border-stone-200/60 bg-white px-3 py-3 text-center text-stone-850 no-underline shadow-warm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                            >
                              <MemberAvatar firstName={member.firstName} lastName={member.lastName} photoUrl={member.photoUrl} />
                              <span className="mt-2 font-display text-base font-bold tracking-tight">{member.fullName}</span>
                              {years ? <span className="text-xs text-stone-500">{years}</span> : null}
                              {label ? <span className="mt-1 text-xs font-semibold text-terracotta">{label}</span> : null}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                    {rowIndex < component.rows.length - 1 ? <TreeLinks columns={component.columns} connectors={nextConnectors} placed={component.rows} /> : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      ))}
      <Unlinked members={members} ids={layout.unlinkedIds} hrefFor={hrefFor} />
    </div>
  );
}

function Unlinked({ members, ids, hrefFor }: { members: readonly Member[]; ids: readonly string[]; hrefFor: (id: string) => string }) {
  if (ids.length === 0) return null;
  const byId = new Map(members.map((member) => [member.id, member]));
  return (
    <div className="mt-10">
      <h2 className="font-display text-2xl font-bold tracking-tight">Not in the tree yet</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {ids.map((id) => {
          const member = byId.get(id);
          if (!member) return null;
          return (
            <li key={id}>
              <Link className="inline-flex items-center gap-2 rounded-full border border-stone-200/60 bg-white px-3 py-1.5 text-sm font-semibold text-stone-850 no-underline shadow-warm" to={hrefFor(id)}>
                <MemberAvatar firstName={member.firstName} lastName={member.lastName} photoUrl={member.photoUrl} size="sm" />
                {member.fullName}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TreeLinks({
  columns,
  connectors,
  placed,
}: {
  columns: number;
  connectors: readonly TreeConnector[];
  placed: readonly { people: { id: string; column: number }[] }[];
}) {
  const columnOf = new Map(placed.flatMap((row) => row.people.map((person) => [person.id, person.column] as const)));
  const height = 36;
  return (
    <svg width={columns * COLUMN} height={height} className="block text-stone-400" aria-hidden>
      {connectors.map((connector) => {
        const parentXs = connector.parentIds.map((id) => ((columnOf.get(id) ?? 0) + 0.5) * COLUMN);
        const childXs = connector.childIds.map((id) => ((columnOf.get(id) ?? 0) + 0.5) * COLUMN);
        if (parentXs.length === 0 || childXs.length === 0) return null;
        const left = Math.min(...parentXs, ...childXs);
        const right = Math.max(...parentXs, ...childXs);
        const mid = height / 2;
        const commands = [
          ...parentXs.map((x) => `M ${x} 0 V ${mid}`),
          `M ${left} ${mid} H ${right}`,
          ...childXs.map((x) => `M ${x} ${mid} V ${height}`),
        ];
        return <path key={`${connector.parentIds.join()}-${connector.childIds.join()}`} d={commands.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.5" />;
      })}
    </svg>
  );
}
