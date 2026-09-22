import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { X } from "lucide-react";
import { listRelationships } from "./filters";
import { MemberForm } from "./MemberForm";
import { emptyFormValues, memberToFormValues } from "./memberForm";
import { MemberProfile } from "./MemberProfile";
import { withSearch, withoutEdit } from "./paths";
import { primaryButtonClass, secondaryButtonClass } from "./styles";
import { useFamily } from "../store/FamilyProvider";

type CloseTarget = "directory" | "view";

export function MemberDrawer({ intent }: { intent: "create" | "existing" }) {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { members, people, getMember, addMember, updateMember, removeMember } = useFamily();
  const member = intent === "existing" && memberId ? getMember(memberId) : undefined;
  const missing = intent === "existing" && !member;
  const editing = !missing && (intent === "create" || searchParams.get("edit") === "1");
  const [dirty, setDirty] = useState(false);
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

  function save(draft: Parameters<typeof addMember>[0]) {
    if (intent === "create") {
      const created = addMember(draft);
      navigate(withSearch(`/members/${encodeURIComponent(created.id)}`, withoutEdit(searchParams)), { replace: true });
      return;
    }
    if (!member) return;
    updateMember(member.id, draft);
    performClose("view");
  }

  function remove() {
    if (!member) return;
    removeMember(member.id);
    navigate(withSearch("/", withoutEdit(searchParams)));
  }

  return (
    <dialog
      ref={dialogRef}
      className="kinfolk-drawer"
      aria-labelledby="member-drawer-title"
      onCancel={onCancel}
      onMouseDown={onBackdrop}
    >
      <div className="flex h-full w-full flex-col bg-white shadow-warm sm:w-[36rem] sm:border-l sm:border-stone-200/60">
        <header className="flex items-start justify-between gap-4 border-b border-stone-200/60 px-6 py-6 sm:px-8">
          <div>
            <h2 id="member-drawer-title" ref={titleRef} tabIndex={-1} className="font-display text-3xl font-bold tracking-tight outline-none">
              {title}
            </h2>
            {intent === "create" ? <p className="mt-1 text-sm text-stone-500">Saved in this browser tab.</p> : null}
          </div>
          <button type="button" className="rounded-full p-2 text-stone-500 transition-all duration-200 ease-out hover:bg-amber-50 hover:text-stone-850" aria-label="Close" onClick={() => requestClose("directory")}>
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {missing ? (
            <p className="text-sm text-stone-500">This person is no longer in the household.</p>
          ) : editing ? (
            <MemberForm
              key={member ? `${member.id}:${member.updatedAt}` : "new"}
              initial={member ? memberToFormValues(member) : emptyFormValues()}
              addressId={member?.address?.id}
              suggestions={listRelationships(members)}
              onDirtyChange={onDirtyChange}
              onSave={save}
            />
          ) : member ? (
            <MemberProfile member={member} people={people} />
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
              <button type="submit" form="member-form" className={primaryButtonClass}>
                {intent === "create" ? "Add member" : "Save changes"}
              </button>
              <button type="button" className={secondaryButtonClass} onClick={() => requestClose(intent === "existing" ? "view" : "directory")}>
                Cancel
              </button>
              {member ? (
                <button type="button" className="px-3 py-2 text-sm font-semibold text-terracotta-deep" onClick={() => setPending("delete")}>
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
