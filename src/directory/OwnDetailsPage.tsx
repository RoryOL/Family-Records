import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { focusMemberId, kinshipLines, linksTouching } from "../lib/kinship";
import { ownProfileInitial } from "../lib/ownProfile";
import { useFamily } from "../store/FamilyProvider";
import { listRelationships } from "./filters";
import { MemberForm } from "./MemberForm";
import { memberToFormValues } from "./memberForm";
import { MemberProfile } from "./MemberProfile";
import { withoutEdit } from "./paths";
import { pageClass, primaryButtonClass, secondaryButtonClass, surfaceClass } from "./styles";

export function OwnDetailsPage() {
  const { group, people, currentUser, members, relations, godparents, saveOwnDetails } = useFamily();
  const [searchParams, setSearchParams] = useSearchParams();
  const editing = searchParams.get("edit") === "1";
  const selfId = focusMemberId(members, currentUser.id);
  const self = selfId ? members.find((member) => member.id === selfId) : undefined;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingDiscard, setPendingDiscard] = useState(false);

  useEffect(() => {
    document.title = `Your details · ${group.name} · Family Records`;
  }, [group.name]);

  function leaveEdit() {
    setPendingDiscard(false);
    setDirty(false);
    setError(null);
    setSearchParams(withoutEdit(searchParams), { replace: true });
  }

  function requestReadMode() {
    if (dirty) {
      setPendingDiscard(true);
      return;
    }
    leaveEdit();
  }

  return (
    <main className={pageClass}>
      <header className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">{group.name}</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{editing || !self ? "Your details" : self.fullName}</h1>
        <p className="mt-3 text-stone-500">
          {self && !editing
            ? "Your details for this household."
            : "Add your birthdate, address, and how you are related to the other people in this household. A brother's children are then your nieces and nephews."}
        </p>
      </header>
      <div className={`${surfaceClass} mt-8 max-w-xl p-6 sm:p-8`}>
        {editing && error ? (
          <p className="mb-4 text-sm text-terracotta-deep" role="alert">
            {error}
          </p>
        ) : null}
        {!editing && saved ? (
          <p className="mb-4 text-sm text-stone-500" role="status">
            Your details are saved for this household.
          </p>
        ) : null}
        {editing ? (
          <MemberForm
            key={self ? `${self.id}:${self.updatedAt}` : "new"}
            initial={self ? memberToFormValues(self, linksTouching(self.id, relations), godparents) : ownProfileInitial(currentUser)}
            selfId={self?.id}
            addressId={self?.address?.id}
            people={members
              .filter((member) => member.id !== self?.id)
              .map((member) => ({ id: member.id, fullName: member.fullName, dateOfBirth: member.dateOfBirth }))}
            suggestions={listRelationships(members)}
            photoUrl={self?.photoUrl ?? null}
            hasPhoto={Boolean(self?.photoPath)}
            onDirtyChange={(next) => {
              setDirty(next);
              if (next) setSaved(false);
            }}
            onSave={(draft, photo, links, sponsors) => {
              setSaving(true);
              setError(null);
              void saveOwnDetails(draft, photo, links, sponsors)
                .then(() => {
                  setSaved(true);
                  setDirty(false);
                  setSearchParams(withoutEdit(searchParams), { replace: true });
                })
                .catch((caught: unknown) => {
                  setError(caught instanceof Error ? caught.message : "Your details could not be saved.");
                })
                .finally(() => setSaving(false));
            }}
          />
        ) : self ? (
          <MemberProfile
            member={self}
            people={people}
            lines={kinshipLines(
              self.id,
              members.map((member) => ({ id: member.id, fullName: member.fullName, gender: member.gender })),
              relations,
            )}
            relations={relations}
            godparents={godparents}
            household={members}
          />
        ) : (
          <p className="text-sm text-stone-500">Your birthdate, address, and relationships are not in this household yet.</p>
        )}
        {editing ? (
          pendingDiscard ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">Discard unsaved changes?</p>
              <div className="flex gap-2">
                <button type="button" className={secondaryButtonClass} onClick={() => setPendingDiscard(false)}>
                  Keep
                </button>
                <button type="button" className={primaryButtonClass} onClick={leaveEdit}>
                  Discard
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="submit" form="member-form" className={primaryButtonClass} disabled={saving}>
                Save your details
              </button>
              <button type="button" className={secondaryButtonClass} disabled={saving} onClick={requestReadMode}>
                Cancel
              </button>
            </div>
          )
        ) : (
          <Link to="/me?edit=1" className={`${primaryButtonClass} mt-6`}>
            {self ? "Edit your details" : "Add your details"}
          </Link>
        )}
      </div>
    </main>
  );
}
