import { useEffect, useState } from "react";
import { focusMemberId, linksTouching } from "../lib/kinship";
import { ownProfileInitial } from "../lib/ownProfile";
import { useFamily } from "../store/FamilyProvider";
import { listRelationships } from "./filters";
import { MemberForm } from "./MemberForm";
import { memberToFormValues } from "./memberForm";
import { pageClass, primaryButtonClass, surfaceClass } from "./styles";

export function OwnDetailsPage() {
  const { group, currentUser, members, relations, saveOwnDetails } = useFamily();
  const selfId = focusMemberId(members, currentUser.id);
  const self = selfId ? members.find((member) => member.id === selfId) : undefined;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.title = `Your details · ${group.name} · Family Records`;
  }, [group.name]);

  return (
    <main className={pageClass}>
      <header className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">{group.name}</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Your details</h1>
        <p className="mt-3 text-stone-500">
          Add your birthdate, address, and how you are related to the other people in this household. A brother&apos;s children are then your nieces and nephews.
        </p>
      </header>
      <div className={`${surfaceClass} mt-8 max-w-xl p-6 sm:p-8`}>
        {error ? (
          <p className="mb-4 text-sm text-terracotta-deep" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="mb-4 text-sm text-stone-500" role="status">
            Your details are saved for this household.
          </p>
        ) : null}
        <MemberForm
          key={self ? `${self.id}:${self.updatedAt}` : "new"}
          initial={self ? memberToFormValues(self, linksTouching(self.id, relations)) : ownProfileInitial(currentUser)}
          addressId={self?.address?.id}
          people={members.filter((member) => member.id !== self?.id).map((member) => ({ id: member.id, fullName: member.fullName }))}
          suggestions={listRelationships(members)}
          photoUrl={self?.photoUrl ?? null}
          hasPhoto={Boolean(self?.photoPath)}
          onDirtyChange={(dirty) => {
            if (dirty) setSaved(false);
          }}
          onSave={(draft, photo, links) => {
            setSaving(true);
            setError(null);
            void saveOwnDetails(draft, photo, links)
              .then(() => setSaved(true))
              .catch((caught: unknown) => {
                setError(caught instanceof Error ? caught.message : "Your details could not be saved.");
              })
              .finally(() => setSaving(false));
          }}
        />
        <button type="submit" form="member-form" className={`${primaryButtonClass} mt-6`} disabled={saving}>
          Save your details
        </button>
      </div>
    </main>
  );
}
