import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { X } from "lucide-react";
import { listRelationships } from "./filters";
import { MemberForm } from "./MemberForm";
import { emptyFormValues, memberToFormValues } from "./memberForm";
import { MemberProfile } from "./MemberProfile";
import { withSearch, withoutEdit } from "./paths";
import { primaryButtonClass, secondaryButtonClass } from "./styles";
import { kinshipLines, linksTouching } from "../lib/kinship";
import type { MemberPhotoSelection } from "../lib/memberPhoto";
import type { MemberLinkInput } from "../types";
import { useFamily } from "../store/FamilyProvider";

type CloseTarget = "directory" | "view";

export function MemberDrawer({ intent }: { intent: "create" | "existing" }) {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { members, relations, godparents, people, getMember, addMember, updateMember, removeMember } = useFamily();
  const member = intent === "existing" && memberId ? getMember(memberId) : undefined;
  const missing = intent === "existing" && !member;
  const editing = !missing && (intent === "create" || searchParams.get("edit") === "1");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, setPending] = useState<"discard" | "delete" | null>(null);
  const [closeTarget, setCloseTarget] = useState<CloseTarget>("directory");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onDirtyChange = useCallback((value: boolean) => setDirty(value), []);

  const title = intent === "create" ? "Add a member" : editing ? "Edit profile" : (member?.fullName ?? "Profile");

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    if (!editing) titleRef.current?.focus();
  }, [editing, title]);

  function performClose(target: CloseTarget) {
    const search = withoutEdit(searchParams);
    if (target === "view" && memberId) {
      navigate(withSearch(`/members/${encodeURIComponent(memberId)}`, search), { replace: true });
    } else {
      navigate(withSearch("/", search));
    }
    setPending(null);
  }

  function requestClose(target: CloseTarget) {
    if (pending === "delete") {
      setPending(null);
      return;
    }
    if (editing && dirty && pending !== "discard") {
      setCloseTarget(target);
      setPending("discard");
      return;
    }
    performClose(pending === "discard" ? closeTarget : target);
  }

  function onCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    requestClose(editing && intent === "existing" ? "view" : "directory");
  }

  function onBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) requestClose("directory");
  }

  async function save(draft: Parameters<typeof addMember>[0], photo: MemberPhotoSelection, links: readonly MemberLinkInput[], sponsors: Parameters<typeof addMember>[3]) {
    setSaving(true);
    setSaveError(null);
    try {
      if (intent === "create") {
        const created = await addMember(draft, photo.file, links, sponsors);
        navigate(withSearch(`/members/${encodeURIComponent(created.id)}`, withoutEdit(searchParams)), { replace: true });
        return;
      }
      if (!member) return;
      await updateMember(member.id, draft, photo, links, sponsors);
      performClose("view");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "That change could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!member) return;
    setSaving(true);
    setSaveError(null);
    try {
      await removeMember(member.id);
      navigate(withSearch("/", withoutEdit(searchParams)));
    } catch (error) {
      setPending(null);
      setSaveError(error instanceof Error ? error.message : "That person could not be removed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="member-drawer"
      aria-labelledby="member-drawer-title"
      onCancel={onCancel}
      onMouseDown={onBackdrop}
    >
      <div className="flex h-full w-full flex-col bg-white pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] shadow-warm sm:w-[36rem] sm:border-l sm:border-stone-200/60 sm:pl-0">
        <header className="flex items-start justify-between gap-4 border-b border-stone-200/60 px-6 py-6 sm:px-8">
          <div>
            <h2 id="member-drawer-title" ref={titleRef} tabIndex={-1} className="font-display text-3xl font-bold tracking-tight outline-none">
              {title}
            </h2>
            {intent === "create" ? <p className="mt-1 text-sm text-stone-500">Saved for this household.</p> : null}
          </div>
          <button type="button" className="rounded-full p-2 text-stone-500 transition-all duration-200 ease-out hover:bg-amber-50 hover:text-stone-850" aria-label="Close" onClick={() => requestClose("directory")}>
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {saveError ? (
            <p className="mb-4 text-sm text-terracotta-deep" role="alert">
              {saveError}
            </p>
          ) : null}
          {missing ? (
            <p className="text-sm text-stone-500">This person is no longer in the household.</p>
          ) : editing ? (
            <MemberForm
              key={member ? `${member.id}:${member.updatedAt}` : "new"}
              initial={member ? memberToFormValues(member, linksTouching(member.id, relations), godparents) : emptyFormValues()}
              selfId={member?.id}
              addressId={member?.address?.id}
              people={members
                .filter((item) => item.id !== member?.id)
                .map((item) => ({ id: item.id, fullName: item.fullName, dateOfBirth: item.dateOfBirth }))}
              suggestions={listRelationships(members)}
              photoUrl={member?.photoUrl ?? null}
              hasPhoto={Boolean(member?.photoPath)}
              onDirtyChange={onDirtyChange}
              onSave={save}
            />
          ) : member ? (
            <MemberProfile
              member={member}
              people={people}
              lines={kinshipLines(
                member.id,
                members.map((item) => ({ id: item.id, fullName: item.fullName, gender: item.gender })),
                relations,
              )}
              relations={relations}
              godparents={godparents}
              household={members}
            />
          ) : null}
        </div>

        <footer className="border-t border-stone-200/60 px-6 py-5 sm:px-8">
          {pending === "discard" ? (
            <Confirm
              message="Discard unsaved changes?"
              confirmLabel="Discard"
              onConfirm={() => performClose(closeTarget)}
              onCancel={() => setPending(null)}
            />
          ) : pending === "delete" && member ? (
            <Confirm
              message={`Remove ${member.fullName} from this household?`}
              confirmLabel="Remove"
              onConfirm={remove}
              onCancel={() => setPending(null)}
            />
          ) : editing ? (
            <div className="flex flex-wrap gap-2">
              <button type="submit" form="member-form" className={primaryButtonClass} disabled={saving}>
                {intent === "create" ? "Add member" : "Save changes"}
              </button>
              <button type="button" className={secondaryButtonClass} disabled={saving} onClick={() => requestClose(intent === "existing" ? "view" : "directory")}>
                Cancel
              </button>
              {member ? (
                <button type="button" className="px-3 py-2 text-sm font-semibold text-terracotta-deep" disabled={saving} onClick={() => setPending("delete")}>
                  Remove
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {member ? (
                <button type="button" className={primaryButtonClass} onClick={() => startEdit(member.id)}>
                  Edit profile
                </button>
              ) : null}
              <button type="button" className={secondaryButtonClass} onClick={() => requestClose("directory")}>
                {member ? "Close" : "Back to directory"}
              </button>
              {member ? (
                <button type="button" className="px-3 py-2 text-sm font-semibold text-terracotta-deep" onClick={() => setPending("delete")}>
                  Remove
                </button>
              ) : null}
            </div>
          )}
        </footer>
      </div>
    </dialog>
  );

  function startEdit(id: string) {
    const next = new URLSearchParams(searchParams);
    next.set("edit", "1");
    navigate(withSearch(`/members/${encodeURIComponent(id)}`, next));
  }
}

function Confirm({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">{message}</p>
      <div className="flex gap-2">
        <button type="button" className={secondaryButtonClass} onClick={onCancel}>
          Keep
        </button>
        <button type="button" className={primaryButtonClass} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
