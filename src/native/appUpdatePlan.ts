const RELEASE_DIRECTORY = "/storage/v1/object/public/app-releases/";

export type ReleaseFileName = "version.json" | "family-records.apk";

export interface AppRelease {
  versionCode: number;
  versionName: string;
}

export interface AppReleaseUrls {
  manifest: string;
  apk: string;
}

export type ApkUpdateDecision = "update" | "current" | "invalid";

/** Public Supabase objects for the latest signed APK. */
export function appReleaseUrls(supabaseUrl: string): AppReleaseUrls | null {
  try {
    const url = new URL(supabaseUrl.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const manifest = `${url.origin}${RELEASE_DIRECTORY}version.json`;
    const apk = `${url.origin}${RELEASE_DIRECTORY}family-records.apk`;
    if (!isAppReleaseFile(manifest, "version.json") || !isAppReleaseFile(apk, "family-records.apk")) return null;
    return { manifest, apk };
  } catch {
    return null;
  }
}

export function isAppReleaseFile(value: string, fileName: ReleaseFileName): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.hash) return false;
    return url.pathname.endsWith(`${RELEASE_DIRECTORY}${fileName}`);
  } catch {
    return false;
  }
}

/** Resume checks wait so a finished install is not downloaded again. A manual retry does not wait. */
export function shouldStartApkCheck(now: number, pauseUntil: number, force: boolean): boolean {
  return force || now >= pauseUntil;
}

/** A newer versionCode can replace the installed app. An equal or older build cannot. */
export function apkUpdateDecision(localBuild: string, remoteVersionCode: number): ApkUpdateDecision {
  if (!Number.isInteger(remoteVersionCode) || remoteVersionCode < 1) return "invalid";
  const local = Number(localBuild);
  if (!Number.isInteger(local) || local < 1) return "invalid";
  return remoteVersionCode > local ? "update" : "current";
}

export function parseAppRelease(value: unknown): AppRelease | null {
  if (!value || typeof value !== "object") return null;
  const record = value as { versionCode?: unknown; versionName?: unknown };
  const versionCode = record.versionCode;
  if (!Number.isInteger(versionCode) || (versionCode as number) < 1) return null;
  const versionName = typeof record.versionName === "string" && record.versionName.trim() ? record.versionName.trim() : String(versionCode);
  return { versionCode: versionCode as number, versionName };
}
