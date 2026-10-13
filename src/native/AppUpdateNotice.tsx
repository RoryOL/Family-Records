import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { primaryButtonClass } from "../directory/styles";
import { checkForApkUpdate, openInstallPermission, type UpdatePhase } from "./appUpdate";

export function AppUpdateNotice() {
  const [phase, setPhase] = useState<UpdatePhase>({ phase: "idle" });

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;
    let active = true;
    const report = (next: UpdatePhase) => {
      if (active) setPhase(next);
    };
    void checkForApkUpdate(report);
    let remove = () => undefined;
    void App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void checkForApkUpdate(report);
    }).then((handle) => {
      remove = () => {
        void handle.remove();
      };
      if (!active) remove();
    });
    return () => {
      active = false;
      remove();
    };
  }, []);

  return (
    <AppUpdateBanner
      phase={phase}
      onAllow={() => void openInstallPermission()}
      onRetry={() => void checkForApkUpdate(setPhase, { force: true })}
    />
  );
}

export function AppUpdateBanner({
  phase,
  onAllow,
  onRetry,
}: {
  phase: UpdatePhase;
  onAllow: () => void;
  onRetry: () => void;
}) {
  if (phase.phase === "idle") return null;

  const message =
    phase.phase === "downloading"
      ? "Downloading the latest Family Records."
      : phase.phase === "installing"
        ? "Installing the latest Family Records."
        : phase.phase === "confirm"
          ? "Confirm the install to finish updating."
          : phase.phase === "permission"
            ? "Allow Family Records to install updates. Android asks for this once."
            : phase.message;

  return (
    <div className="border-b border-amber-100 bg-amber-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-sm text-stone-850" role="status">
          {message}
        </p>
        {phase.phase === "permission" ? (
          <button type="button" className={primaryButtonClass} onClick={onAllow}>
            Allow installs
          </button>
        ) : null}
        {phase.phase === "failed" ? (
          <button type="button" className={primaryButtonClass} onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}
