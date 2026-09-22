import { useEffect, useId, useRef, useState, type FormEvent, type Ref } from "react";
import { SUGGESTED_RELATIONSHIPS } from "../types";
import { nextBirthdayLabel } from "./memberDisplay";
import {
  dateWarning,
  formValuesToDraft,
  hasFormErrors,
  validateMemberForm,
  type MemberFormErrors,
  type MemberFormValues,
} from "./memberForm";
import { inputClass, labelClass } from "./styles";
import type { MemberDraft } from "../types";

export function MemberForm({
  initial,
  addressId,
  suggestions,
  onSave,
  onDirtyChange,
}: {
  initial: MemberFormValues;
  addressId?: string;
  suggestions: readonly string[];
  onSave: (draft: MemberDraft) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<MemberFormErrors>({});
  const baseId = useId();
  const listId = `${baseId}-relationships`;
  const firstNameRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const tags = [...new Set([...suggestions, ...SUGGESTED_RELATIONSHIPS])].sort((a, b) => a.localeCompare(b));
  const warning = dateWarning(values.dateOfBirth);
  const next = nextBirthdayLabel(values.dateOfBirth.trim() || null);

  useEffect(() => {
    onDirtyChange(JSON.stringify(values) !== JSON.stringify(initial));
  }, [values, initial, onDirtyChange]);

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  function update<Key extends keyof MemberFormValues>(key: Key, value: MemberFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateMemberForm(values);
    setErrors(nextErrors);
    if (nextErrors.firstName) firstNameRef.current?.focus();
    else if (nextErrors.dateOfBirth) dateRef.current?.focus();
    else if (nextErrors.email) emailRef.current?.focus();
    if (hasFormErrors(nextErrors)) return;
    onSave(formValuesToDraft(values, addressId));
  }

  return (
    <form id="member-form" className="grid gap-4" noValidate onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`${baseId}-first`}
          label="First name"
          required
          autoComplete="given-name"
          value={values.firstName}
          error={errors.firstName}
          inputRef={firstNameRef}
          onChange={(value) => update("firstName", value)}
        />
        <TextField
          id={`${baseId}-last`}
          label="Last name"
          autoComplete="family-name"
          value={values.lastName}
          onChange={(value) => update("lastName", value)}
        />
      </div>
      <TextField
        id={`${baseId}-relationship`}
        label="Relationship"
        list={listId}
        placeholder="Cousin, parent, neighbor"
        value={values.relationship}
        onChange={(value) => update("relationship", value)}
      />
      <datalist id={listId}>
        {tags.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
      <div>
        <TextField
          id={`${baseId}-dob`}
          label="Date of birth"
          type="date"
          autoComplete="bday"
          value={values.dateOfBirth}
          error={errors.dateOfBirth}
          inputRef={dateRef}
          onChange={(value) => update("dateOfBirth", value)}
        />
        {!errors.dateOfBirth && warning ? <p className="mt-1 text-sm text-honey">{warning}</p> : null}
        {!errors.dateOfBirth && next ? <p className="mt-1 text-sm text-stone-500">{next}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`${baseId}-phone`}
          label="Phone"
          type="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={(value) => update("phone", value)}
        />
        <TextField
          id={`${baseId}-email`}
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          inputRef={emailRef}
          onChange={(value) => update("email", value)}
        />
      </div>
      <fieldset className="grid gap-4">
        <legend className={labelClass}>Postal address</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-terracotta"
            checked={values.addressFormat === "international"}
            onChange={(event) => update("addressFormat", event.target.checked ? "international" : "ie")}
          />
          International address
        </label>
        {values.addressFormat === "international" ? (
          <>
            <TextField id={`${baseId}-line1`} label="Street" autoComplete="address-line1" value={values.line1} onChange={(value) => update("line1", value)} />
            <TextField id={`${baseId}-line2`} label="Apartment, suite" autoComplete="address-line2" value={values.line2} onChange={(value) => update("line2", value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id={`${baseId}-city`} label="City" autoComplete="address-level2" value={values.city} onChange={(value) => update("city", value)} />
              <TextField id={`${baseId}-region`} label="Region" autoComplete="address-level1" value={values.region} onChange={(value) => update("region", value)} />
              <TextField id={`${baseId}-postal`} label="Postal code" autoComplete="postal-code" value={values.postalCode} onChange={(value) => update("postalCode", value)} />
              <TextField id={`${baseId}-country`} label="Country" autoComplete="country-name" value={values.country} onChange={(value) => update("country", value)} />
            </div>
          </>
        ) : (
          <>
            <TextField id={`${baseId}-line1`} label="Address line 1" autoComplete="address-line1" value={values.line1} onChange={(value) => update("line1", value)} />
            <TextField id={`${baseId}-line2`} label="Address line 2" autoComplete="address-line2" value={values.line2} onChange={(value) => update("line2", value)} />
            <TextField id={`${baseId}-line3`} label="Address line 3" autoComplete="address-line3" value={values.line3} onChange={(value) => update("line3", value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id={`${baseId}-city`} label="Town/City" autoComplete="address-level2" value={values.city} onChange={(value) => update("city", value)} />
              <TextField id={`${baseId}-region`} label="County" autoComplete="address-level1" value={values.region} onChange={(value) => update("region", value)} />
            </div>
            <TextField id={`${baseId}-postal`} label="Eircode" autoComplete="postal-code" value={values.postalCode} onChange={(value) => update("postalCode", value)} />
          </>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-terracotta"
            checked={values.verified}
            onChange={(event) => update("verified", event.target.checked)}
          />
          Verified for mailing
        </label>
      </fieldset>
      <div>
        <label htmlFor={`${baseId}-notes`} className={labelClass}>
          Notes
        </label>
        <textarea
          id={`${baseId}-notes`}
          className={`${inputClass} min-h-28 resize-y`}
          value={values.notes}
          onChange={(event) => update("notes", event.target.value)}
        />
      </div>
    </form>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  list,
  placeholder,
  required = false,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  list?: string;
  placeholder?: string;
  required?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? <span className="text-terracotta"> *</span> : null}
      </label>
      <input
        ref={inputRef}
        id={id}
        className={inputClass}
        type={type}
        value={value}
        list={list}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-terracotta-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}
