import type { LinkRole, MemberLinkInput } from "../types";
import { inputClass, labelClass } from "./styles";

const roles: { value: LinkRole; label: string }[] = [
  { value: "parent", label: "the parent of" },
  { value: "child", label: "the child of" },
  { value: "sibling", label: "the sibling of" },
  { value: "spouse", label: "the partner of" },
  { value: "married", label: "married to" },
];

export function FamilyLinksField({
  links,
  people,
  error,
  onChange,
}: {
  links: readonly MemberLinkInput[];
  people: readonly { id: string; fullName: string }[];
  error?: string;
  onChange: (links: MemberLinkInput[]) => void;
}) {
  const ordered = [...people].sort((left, right) => left.fullName.localeCompare(right.fullName) || left.id.localeCompare(right.id));

  function update(index: number, patch: Partial<MemberLinkInput>) {
    onChange(links.map((link, linkIndex) => (linkIndex === index ? { ...link, ...patch } : link)));
  }

  return (
    <fieldset className="grid gap-3">
      <legend className={labelClass}>Relationships</legend>
      <p className="text-sm text-stone-500">
        Record how this person is related to someone else. A brother&apos;s children are nieces and nephews. A partner&apos;s child is a son or daughter.
        Only a marriage has a marriage date.
      </p>
      {ordered.length === 0 ? (
        <p className="text-sm text-stone-500">Save another person, then you can record how they are related.</p>
      ) : (
        links.map((link, index) => (
          <div key={`${index}-${link.otherId}`} className="flex flex-wrap items-center gap-2">
            <span className="text-sm">This person is</span>
            <select
              aria-label={`Relationship ${index + 1}`}
              className={`${inputClass} mt-0 w-auto`}
              value={link.role}
              onChange={(event) => {
                const role = event.target.value as LinkRole;
                update(index, { role, weddingDate: role === "married" ? link.weddingDate : "" });
              }}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <select
              aria-label={`Related person ${index + 1}`}
              className={`${inputClass} mt-0 min-w-40 flex-1`}
              value={link.otherId}
              onChange={(event) => update(index, { otherId: event.target.value })}
            >
              <option value="">Choose a person</option>
              {ordered.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.fullName}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="px-2 py-2 text-sm font-semibold text-terracotta-deep"
              onClick={() => onChange(links.filter((_, linkIndex) => linkIndex !== index))}
            >
              Remove
            </button>
            {link.role === "married" ? (
              <label className="grid basis-full gap-1 text-sm sm:max-w-xs">
                Marriage date
                <input
                  aria-label={`Marriage date ${index + 1}`}
                  type="date"
                  className={`${inputClass} mt-0`}
                  value={link.weddingDate ?? ""}
                  onChange={(event) => update(index, { weddingDate: event.target.value })}
                />
              </label>
            ) : null}
          </div>
        ))
      )}
      {ordered.length > 0 ? (
        <button
          type="button"
          className="self-start text-sm font-semibold text-terracotta"
          onClick={() => onChange([...links, { otherId: "", role: "sibling" }])}
        >
          Add relationship
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-terracotta-deep">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
