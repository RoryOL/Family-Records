import { describe, expect, it } from "vitest";
import { apkUpdateDecision, appReleaseUrls, isAppReleaseFile, parseAppRelease, shouldStartApkCheck } from "./appUpdatePlan";

const project = "https://example.supabase.co";

describe("app release urls", () => {
  it("points at the public app-releases objects", () => {
    expect(appReleaseUrls(`${project}/`)).toEqual({
      manifest: `${project}/storage/v1/object/public/app-releases/version.json`,
      apk: `${project}/storage/v1/object/public/app-releases/family-records.apk`,
    });
  });

  it("rejects a URL that is not the Family Records build", () => {
    expect(appReleaseUrls("http://example.supabase.co")).toBeNull();
    expect(appReleaseUrls("not a url")).toBeNull();
    expect(isAppReleaseFile("https://evil.example/family-records.apk", "family-records.apk")).toBe(false);
    expect(isAppReleaseFile(`${project}/storage/v1/object/public/app-releases/other.apk`, "family-records.apk")).toBe(false);
    expect(isAppReleaseFile(`${project}/storage/v1/object/public/app-releases/family-records.apk#apk`, "family-records.apk")).toBe(false);
  });
});

describe("apk check pause", () => {
  it("waits after an install starts, and a manual retry does not", () => {
    expect(shouldStartApkCheck(1_000, 2_000, false)).toBe(false);
    expect(shouldStartApkCheck(2_000, 2_000, false)).toBe(true);
    expect(shouldStartApkCheck(1_000, 2_000, true)).toBe(true);
  });
});

describe("apkUpdateDecision", () => {
  it("updates only when the published versionCode is higher", () => {
    expect(apkUpdateDecision("4", 5)).toBe("update");
    expect(apkUpdateDecision("5", 5)).toBe("current");
    expect(apkUpdateDecision("6", 5)).toBe("current");
    expect(apkUpdateDecision("1", 1.5)).toBe("invalid");
    expect(apkUpdateDecision("", 2)).toBe("invalid");
    expect(apkUpdateDecision("0", 2)).toBe("invalid");
  });

  it("reads a version file", () => {
    expect(parseAppRelease({ versionCode: 8, versionName: "8" })).toEqual({ versionCode: 8, versionName: "8" });
    expect(parseAppRelease({ versionCode: 8 })).toEqual({ versionCode: 8, versionName: "8" });
    expect(parseAppRelease({ versionCode: "8" })).toBeNull();
    expect(parseAppRelease(null)).toBeNull();
  });
});
