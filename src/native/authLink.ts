import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { getSupabase } from "../supabase/client";

/** Opens the installed Android app after an email confirmation. */
export const NATIVE_AUTH_REDIRECT = "familyrecords://auth-callback";

export function nativeSignUpRedirect(): string | undefined {
  return Capacitor.isNativePlatform() ? NATIVE_AUTH_REDIRECT : undefined;
}

export function authCallbackParams(url: string): { code: string | null; accessToken: string | null; refreshToken: string | null } {
  const parsed = new URL(url);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  return {
    code: parsed.searchParams.get("code"),
    accessToken: hash.get("access_token"),
    refreshToken: hash.get("refresh_token"),
  };
}

export async function completeAuthFromUrl(url: string): Promise<void> {
  const { code, accessToken, refreshToken } = authCallbackParams(url);
  const supabase = getSupabase();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
  }
}

export function listenForAuthLinks(): void {
  if (!Capacitor.isNativePlatform()) return;
  void App.getLaunchUrl().then((launch) => {
    if (launch?.url) void completeAuthFromUrl(launch.url);
  });
  void App.addListener("appUrlOpen", ({ url }) => {
    void completeAuthFromUrl(url);
  });
}
