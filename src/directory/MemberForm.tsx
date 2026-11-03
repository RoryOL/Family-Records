import { ImagePlus } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type Ref } from "react";
import { yearsLived } from "../lib/members";
import { photoProblem, type MemberPhotoSelection } from "../lib/memberPhoto";
import { SUGGESTED_RELATIONSHIPS } from "../types";
import { DateField } from "./DateField";
import { FamilyLinksField } from "./FamilyLinksField";
import { GodparentsField } from "./GodparentsField";
import { MemberAvatar } from "./MemberAvatar";
import { nextBirthdayLabel } from "./memberDisplay";
import {
  dateWarning,
  formValuesToDraft,
  hasFormErrors,
  validateMemberForm,
  type MemberFormErrors,
  type MemberFormValues,
} from "./memberForm";
import { lookupEircode } from "../lib/eircode";
import { EircodeHint } from "./EircodeHint";
import { inputClass, labelClass, secondaryButtonClass } from "./styles";
import type { MemberDraft, MemberLinkInput } from "../types";

export function MemberForm({
  initial,
  addressId,
  suggestions,
  photoUrl = null,
  hasPhoto = false,
  people = [],
  selfId,
  focusId = null,
  familyName = "",
  surnames = [],
  onSave,
  onDirtyChange,
}: {
  initial: MemberFormValues;
  addressId?: string;
  suggestions: readonly string[];
  photoUrl?: string | null;
  hasPhoto?: boolean;
  people?: readonly { id: string; fullName: string; dateOfBirth?: string | null }[];
  selfId?: string;
  /** Signed-in member, listed first when this person is related to them. */
  focusId?: string | null;
  /** Signed-in surname. Marked on the surname choices for a new person. */
  familyName?: string;
  /** Household surnames, family name first. Shown while adding someone new. */
  surnames?: readonly string[];
  onSave: (draft: MemberDraft, photo: MemberPhotoSelection, links: MemberLinkInput[], godparents: MemberFormValues["godparents"]) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<MemberFormErrors>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const baseId = useId();
  const postalHintId = `${baseId}-postal-lookup`;
  const listId = `${baseId}-relationships`;
  const firstNameRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const deathRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const tags = [...new Set([...suggestions, ...SUGGESTED_RELATIONSHIPS])].sort((a, b) => a.localeCompare(b));
  const warning = dateWarning(values.dateOfBirth);
  const next = values.deceased ? null : nextBirthdayLabel(values.dateOfBirth.trim() || null);
  const deathWarning = values.deceased ? dateWarning(values.dateOfDeath) : null;
  const lived = values.deceased ? yearsLived(values.dateOfBirth.trim() || null, values.dateOfDeath.trim() || null) : null;

  const showingSaved = hasPhoto && !photoRemoved && !photoFile;
  const displayUrl = photoFile ? previewUrl : showingSaved ? photoUrl : null;

  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    const textDirty = JSON.stringify(values) !== JSON.stringify(initial);
    onDirtyChange(textDirty || photoFile !== null || photoRemoved);
  }, [values, initial, onDirtyChange, photoFile, photoRemoved]);

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  function update<Key extends keyof MemberFormValues>(key: Key, value: MemberFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateMemberForm(values, selfId, people);
    setErrors(nextErrors);
    if (nextErrors.firstName) firstNameRef.current?.focus();
    else if (nextErrors.dateOfBirth) dateRef.current?.focus();
    else if (nextErrors.dateOfDeath) deathRef.current?.focus();
    else if (nextErrors.email) emailRef.current?.focus();
    if (hasFormErrors(nextErrors)) return;
    onSave(formValuesToDraft(values, addressId), { file: photoFile, remove: photoRemoved && !photoFile }, values.links, values.godparents);
  }

  function choosePhoto(file: File) {
    const problem = photoProblem(file);
    if (problem) {
      setPhotoError(problem);
      return;
    }
    setPhotoError(null);
    setPhotoRemoved(false);
    setPhotoFile(file);
  }

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoRemoved(true);
    setPhotoError(null);
  }

  return (
    <form id="member-form" className="grid gap-4" noValidate onSubmit={onSubmit}>
      <div>
        <p className={labelClass}>Picture</p>
        <div className="mt-2 flex items-center gap-4">
          <MemberAvatar firstName={values.firstName} lastName={values.lastName} photoUrl={displayUrl} size="lg" />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondaryButtonClass} onClick={() => photoRef.current?.click()}>
              <ImagePlus size={16} aria-hidden />
              {photoFile || showingSaved ? "Change picture" : "Add picture"}
            </button>
            {photoFile || showingSaved ? (
              <button type="button" className="px-3 py-2 text-sm font-semibold text-terracotta-deep" onClick={clearPhoto}>
                Remove picture
              </button>
            ) : null}
          </div>
        </div>
        <input
          ref={photoRef}
          id={`${baseId}-photo`}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Picture"
          aria-describedby={photoError ? `${baseId}-photo-error` : undefined}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) choosePhoto(file);
          }}
        />
        {photoError ? (
          <p id={`${baseId}-photo-error`} role="alert" className="mt-2 text-sm text-terracotta-deep">
            {photoError}
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-500">JPEG, PNG, or WebP, up to 12 MB.</p>
        )}
      </div>
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
        <div>
          <TextField
            id={`${baseId}-last`}
            label="Last name"
            autoComplete="family-name"
            value={values.lastName}
            onChange={(value) => update("lastName", value)}
          />
          {!selfId && surnames.length > 0 ? (
            <div className="mt-2" role="group" aria-label="Surnames">
              <p className="text-xs text-stone-500">Choose a surname</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {surnames.map((name) => {
                  const selected = values.lastName.trim().toLocaleLowerCase() === name.toLocaleLowerCase();
                  const yours = familyName.trim().toLocaleLowerCase() === name.toLocaleLowerCase();
                  return (
                    <button
                      key={name}
                      type="button"
                      aria-pressed={selected}
                      className={`rounded-full px-3 py-1 text-sm font-semibold transition-all duration-200 ease-out ${
                        selected ? "bg-terracotta text-white shadow-warm" : "border border-stone-200/60 bg-white text-stone-850 shadow-warm hover:bg-amber-50"
                      }`}
                      onClick={() => update("lastName", name)}
                    >
                      {name}
                      {yours ? <span className="font-normal"> · yours</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div>
        <label htmlFor={`${baseId}-gender`} className={labelClass}>
          Gender
        </label>
        <select
          id={`${baseId}-gender`}
          className={inputClass}
          value={values.gender}
          onChange={(event) => update("gender", event.target.value === "female" || event.target.value === "male" ? event.target.value : "")}
        >
          <option value="">Not specified</option>
          <option value="female">Woman</option>
          <option value="male">Man</option>
        </select>
        <p className="mt-1 text-sm text-stone-500">Used for brother or sister, and niece or nephew.</p>
      </div>
      <FamilyLinksField
        links={values.links}
        people={people}
        focusId={focusId}
        error={errors.links}
        onChange={(links) => update("links", links)}
      />
      <GodparentsField
        slots={values.godparents}
        people={people}
        subjectDateOfBirth={values.dateOfBirth}
        error={errors.godparents}
        onChange={(godparents) => update("godparents", godparents)}
      />
      <TextField
        id={`${baseId}-relationship`}
        label="Label"
        list={listId}
        placeholder="Friend, neighbor"
        value={values.relationship}
        onChange={(value) => update("relationship", value)}
      />
      <datalist id={listId}>
        {tags.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
      <div>
        <DateField
          id={`${baseId}-dob`}
          label="Date of birth"
          autoComplete="bday"
          value={values.dateOfBirth}
          error={errors.dateOfBirth}
          inputRef={dateRef}
          onChange={(value) => update("dateOfBirth", value)}
        />
        {!errors.dateOfBirth && warning ? <p className="mt-1 text-sm text-honey">{warning}</p> : null}
        {!errors.dateOfBirth && next ? <p className="mt-1 text-sm text-stone-500">{next}</p> : null}
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-terracotta"
            checked={values.deceased}
            aria-describedby={`${baseId}-deceased-hint`}
            onChange={(event) => {
              const deceased = event.target.checked;
              setValues((current) => ({ ...current, deceased, dateOfDeath: deceased ? current.dateOfDeath : "" }));
            }}
          />
          Deceased
        </label>
        <p id={`${baseId}-deceased-hint`} className="mt-1 text-sm text-stone-500">
          Birthdays and greeting cards leave this person out.
        </p>
        {values.deceased ? (
          <div className="mt-4">
            <DateField
              id={`${baseId}-dod`}
              label="Date of death"
              value={values.dateOfDeath}
              error={errors.dateOfDeath}
              inputRef={deathRef}
              onChange={(value) => update("dateOfDeath", value)}
            />
            {!errors.dateOfDeath && deathWarning ? <p className="mt-1 text-sm text-honey">{deathWarning}</p> : null}
            {!errors.dateOfDeath && lived === 0 ? <p className="mt-1 text-sm text-stone-500">Died at less than a year</p> : null}
            {!errors.dateOfDeath && lived != null && lived > 0 ? <p className="mt-1 text-sm text-stone-500">Died at {lived}</p> : null}
          </div>
        ) : null}
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
            <TextField
              id={`${baseId}-postal`}
              label="Eircode"
              autoComplete="postal-code"
              describedBy={values.postalCode.toUpperCase().replace(/[^A-Z0-9]/g, "").length >= 3 ? postalHintId : undefined}
              value={values.postalCode}
              onChange={(value) => update("postalCode", lookupEircode(value)?.formatted ?? value)}
            />
            <EircodeHint
              id={postalHintId}
              postalCode={values.postalCode}
              city={values.city}
              region={values.region}
              onUseTown={(town, county) => setValues((current) => ({ ...current, city: town, region: county }))}
            />
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
  describedBy,
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
  describedBy?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const description = [error ? `${id}-error` : null, describedBy].filter(Boolean).join(" ");
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
        aria-describedby={description || undefined}
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
