import { useState, type FormEvent } from "react";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, surfaceClass } from "../directory/styles";
import { signIn, signUp } from "../supabase/familyApi";
import { GateFrame } from "./GateFrame";
import { signInProblems, signUpProblems } from "./validation";

export function AuthPage() {
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const problem = mode === "create" ? signUpProblems(displayName, email, password) : signInProblems(email, password);
    if (problem) {
      setNotice(null);
      setError(problem);
      return;
    }

    setPending(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "create") {
        const result = await signUp(displayName, email, password);
        if (result === "exists") {
          setError("An account with that email already exists. Sign in instead.");
        } else if (result === "confirm-email") {
          setNotice("Check your email for a confirmation link, then sign in.");
          setMode("sign-in");
        }
      } else {
        await signIn(email, password);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That sign-in could not be completed.");
    } finally {
      setPending(false);
    }
  }

  const creating = mode === "create";

  return (
    <GateFrame
      title={creating ? "Create an account" : "Sign in"}
      lede={creating ? "Your name is what the household sees beside the invite code." : "Use the email for your household."}
    >
      <form className={`${surfaceClass} mt-8 grid max-w-md gap-4 p-6 sm:p-8`} onSubmit={(event) => void submit(event)}>
        {creating ? (
          <label>
            <span className={labelClass}>Name</span>
            <input className={inputClass} autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
        ) : null}
        <label>
          <span className={labelClass}>Email</span>
          <input className={inputClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Password</span>
          <input
            className={inputClass}
            type="password"
            autoComplete={creating ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? (
          <p className="text-sm text-terracotta-deep" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="text-sm text-stone-500" role="status">
            {notice}
          </p>
        ) : null}
        <button type="submit" className={primaryButtonClass} disabled={pending}>
          {creating ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            setMode(creating ? "sign-in" : "create");
            setError(null);
            setNotice(null);
          }}
        >
          {creating ? "I already have an account" : "Create an account"}
        </button>
      </form>
    </GateFrame>
  );
}
