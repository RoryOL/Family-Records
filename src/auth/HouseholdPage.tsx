import { useState, type FormEvent } from "react";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, surfaceClass } from "../directory/styles";
import { GateFrame } from "./GateFrame";
import { householdProblems } from "./validation";

export function HouseholdPage({
  email,
  onCreate,
  onJoin,
  onSignOut,
}: {
  email: string;
  onCreate: (name: string, description: string) => Promise<void>;
  onJoin: (inviteCode: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [pending, setPending] = useState<"create" | "join" | "out" | null>(null);

  async function create(event: FormEvent) {
    event.preventDefault();
    const problem = householdProblems(name, description);
    if (problem) {
      setCreateError(problem);
      return;
    }
    setPending("create");
    setCreateError(null);
    try {
      await onCreate(name, description);
    } catch (caught) {
      setCreateError(caught instanceof Error ? caught.message : "The household could not be created.");
    } finally {
      setPending(null);
    }
  }

  async function join(event: FormEvent) {
    event.preventDefault();
    if (!inviteCode.trim()) {
      setJoinError("Enter an invite code.");
      return;
    }
    setPending("join");
    setJoinError(null);
    try {
      await onJoin(inviteCode);
    } catch (caught) {
      setJoinError(caught instanceof Error ? caught.message : "That invite code could not be used.");
    } finally {
      setPending(null);
    }
  }

  return (
    <GateFrame title="Your household" lede={`${email || "This account"} can start a household or join one with an invite code.`}>
      <div className="mt-8 grid max-w-4xl gap-6 lg:grid-cols-2">
        <form className={`${surfaceClass} grid gap-4 p-6 sm:p-8`} onSubmit={(event) => void create(event)}>
          <h2 className="font-display text-2xl font-bold tracking-tight">Start a household</h2>
          <label>
            <span className={labelClass}>Household name</span>
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span className={labelClass}>Description</span>
            <textarea className={inputClass} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          {createError ? (
            <p className="text-sm text-terracotta-deep" role="alert">
              {createError}
            </p>
          ) : null}
          <button type="submit" className={primaryButtonClass} disabled={pending !== null}>
            Create household
          </button>
        </form>
        <form className={`${surfaceClass} grid content-start gap-4 p-6 sm:p-8`} onSubmit={(event) => void join(event)}>
          <h2 className="font-display text-2xl font-bold tracking-tight">Join with an invite</h2>
          <p className="text-sm text-stone-500">Ask someone in the household for the code. You can read and update the directory after you join.</p>
          <label>
            <span className={labelClass}>Invite code</span>
            <input className={inputClass} autoCapitalize="characters" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="ABCD-EFGH" />
          </label>
          {joinError ? (
            <p className="text-sm text-terracotta-deep" role="alert">
              {joinError}
            </p>
          ) : null}
          <button type="submit" className={primaryButtonClass} disabled={pending !== null}>
            Join household
          </button>
        </form>
      </div>
      <button
        type="button"
        className={`${secondaryButtonClass} mt-6`}
        disabled={pending !== null}
        onClick={() => {
          setPending("out");
          void onSignOut().finally(() => setPending(null));
        }}
      >
        Sign out
      </button>
    </GateFrame>
  );
}
