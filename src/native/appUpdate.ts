import { App } from "@capacitor/app";
import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { supabaseConfig } from "../supabase/client";
import { apkUpdateDecision, appReleaseUrls, shouldStartApkCheck } from "./appUpdatePlan";

export type UpdatePhase =
  | { phase: "idle" }
  | { phase: "downloading" }
  | { phase: "installing" }
  | { phase: "confirm" }
  | { phase: "permission" }
  | { phase: "failed"; message: string };

interface AppUpdateNative {
  readRelease(options: { url: string; anonKey: string }): Promise<{ versionCode: number; versionName: string }>;
  downloadAndInstall(options: { url: string; anonKey: string; versionCode: number }): Promise<void>;
  canRequestInstall(): Promise<{ allowed: boolean }>;
  openInstallSettings(): Promise<void>;
  addListener(event: "installStatus", handler: (event: { status: string }) => void): Promise<PluginListenerHandle>;
}

const AppUpdateNative = registerPlugin<AppUpdateNative>("AppUpdate");

let running = false;
let pauseUntil = 0;
let askedForPermission = false;

export async function openInstallPermission(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;
  await AppUpdateNative.openInstallSettings();
}

/** Checks the published APK and installs it when the versionCode is newer. */
export async function checkForApkUpdate(onPhase: (phase: UpdatePhase) => void, options?: { force?: boolean }): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;
  if (running || !shouldStartApkCheck(Date.now(), pauseUntil, options?.force === true)) return;

  const config = supabaseConfig();
  const urls = config ? appReleaseUrls(config.url) : null;
  if (!config || !urls) return;

  running = true;
  try {
    const info = await App.getInfo();
    let release: { versionCode: number; versionName: string };
    try {
      release = await AppUpdateNative.readRelease({ url: urls.manifest, anonKey: config.anonKey });
    } catch (error) {
      if (errorMessage(error).includes("no-release")) {
        onPhase({ phase: "idle" });
        return;
      }
      throw error;
    }

    if (apkUpdateDecision(info.build, release.versionCode) !== "update") {
      onPhase({ phase: "idle" });
      return;
    }

    const permission = await AppUpdateNative.canRequestInstall();
    if (!permission.allowed) {
      onPhase({ phase: "permission" });
      if (!askedForPermission) {
        askedForPermission = true;
        await AppUpdateNative.openInstallSettings();
      }
      return;
    }

    onPhase({ phase: "downloading" });
    const install = { outcome: "pending" as "pending" | "confirm" | "success" | "failed" };
    const listener = await AppUpdateNative.addListener("installStatus", (event) => {
      if (event.status === "confirm") {
        install.outcome = "confirm";
        onPhase({ phase: "confirm" });
      }
      if (event.status === "success") {
        install.outcome = "success";
        onPhase({ phase: "idle" });
      }
      if (event.status === "failed") {
        install.outcome = "failed";
        pauseUntil = 0;
        onPhase({ phase: "failed", message: "Android did not install the update." });
      }
    });
    try {
      await AppUpdateNative.downloadAndInstall({ url: urls.apk, anonKey: config.anonKey, versionCode: release.versionCode });
      if (install.outcome === "pending") onPhase({ phase: "installing" });
      if (install.outcome !== "failed") pauseUntil = Date.now() + 2 * 60 * 1000;
    } finally {
      window.setTimeout(() => void listener.remove(), 60_000);
    }
  } catch (error) {
    const message = errorMessage(error);
    onPhase({
      phase: "failed",
      message: message && message !== "no-release" ? message : "The update could not be downloaded.",
    });
  } finally {
    running = false;
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "";
}
