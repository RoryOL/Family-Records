import { parseIsoDate } from "../lib/dates";
import { FREE_NAME, godparentOptions, type GodparentSlot } from "../lib/godparents";
import { inputClass, labelClass } from "./styles";

export function GodparentsField({
  slots,
  people,
  subjectDateOfBirth = "",
  error,
  onChange,
}: {
  slots: readonly GodparentSlot[];
  people: readonly { id: string; fullName: string; dateOfBirth?: string | null }[];
  subjectDateOfBirth?: string;
  error?: string;
  onChange: (slots: [GodparentSlot, GodparentSlot]) => void;
}) {
  const dated = parseIsoDate(subjectDateOfBirth.trim());
  const pair: [GodparentSlot, GodparentSlot] = [slots[0] ?? { choice: "", name: "" }, slots[1] ?? { choice: "", name: "" }];

  function update(index: 0 | 1, patch: Partial<GodparentSlot>) {
    const next: [GodparentSlot, GodparentSlot] = [{ ...pair[0] }, { ...pair[1] }];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  return (
    <fieldset className="grid gap-3">
      <legend className={labelClass}>Godparents</legend>
      <p className="text-sm text-stone-500">
        Choose someone already in the household, or type a name for someone who is not listed. Each person can have two.
        {dated ? " Someone younger than this person is left off the list." : ""}
      </p>
      {pair.map((slot, index) => {
        const ordered = godparentOptions(people, subjectDateOfBirth, slot.choice).sort(
          (left, right) => left.fullName.localeCompare(right.fullName) || left.id.localeCompare(right.id),
        );
        return (
          <div key={index} className="grid gap-2">
            <label className="grid gap-1">
              <span className="text-sm">Godparent {index + 1}</span>
              <select
                aria-label={`Godparent ${index + 1}`}
                className={`${inputClass} mt-0`}
                value={slot.choice}
                onChange={(event) => update(index as 0 | 1, { choice: event.target.value, name: event.target.value === FREE_NAME ? slot.name : "" })}
              >
                <option value="">Choose a person</option>
                {ordered.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName}
                  </option>
                ))}
                <option value={FREE_NAME}>Someone not listed</option>
              </select>
            </label>
            {slot.choice === FREE_NAME ? (
              <input
                aria-label={`Godparent ${index + 1} name`}
                className={`${inputClass} mt-0`}
                placeholder="Name"
                value={slot.name}
                onChange={(event) => update(index as 0 | 1, { name: event.target.value })}
              />
            ) : null}
          </div>
        );
      })}
      {error ? (
        <p role="alert" className="text-sm text-terracotta-deep">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
