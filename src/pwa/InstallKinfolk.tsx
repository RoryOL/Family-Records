import { useEffect, useState } from "react";
import { primaryButtonClass } from "../directory/styles";
import { shouldOfferIosHomeScreen } from "./homeScreen";

const HIDDEN_KEY = "kinfolk-hide-install";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function alreadyInstalled(): boolean {
  const iosStandalone = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallKinfolk() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (alreadyInstalled() || localStorage.getItem(HIDDEN_KEY) === "1") return;
    setHidden(false);
    setIosHint(shouldOfferIosHomeScreen(navigator.userAgent, navigator.maxTouchPoints));
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || (!prompt && !iosHint)) return null;

  function dismiss() {
    localStorage.setItem(HIDDEN_KEY, "1");
    setHidden(true);
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setPrompt(null);
    if (choice.outcome === "accepted") dismiss();
  }

  return (
    <div className="border-b border-amber-100 bg-amber-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-sm text-stone-850">
          {prompt ? "Install Kinfolk so it opens like an app." : "Add Kinfolk from the Share menu, then choose Add to Home Screen."}
        </p>
        <div className="flex flex-wrap gap-2">
          {prompt ? (
            <button type="button" className={primaryButtonClass} onClick={() => void install()}>
              Install app
            </button>
          ) : null}
          <button type="button" className="rounded-full px-4 py-2 text-sm font-semibold text-stone-500" onClick={dismiss}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
