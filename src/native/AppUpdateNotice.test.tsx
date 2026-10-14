import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppUpdateBanner } from "./AppUpdateNotice";

describe("AppUpdateBanner", () => {
  it("stays quiet when the installed build is current", () => {
    expect(renderToStaticMarkup(<AppUpdateBanner phase={{ phase: "idle" }} onAllow={() => undefined} onRetry={() => undefined} />)).toBe("");
  });

  it("shows the download and the one-time install permission", () => {
    const downloading = renderToStaticMarkup(
      <AppUpdateBanner phase={{ phase: "downloading" }} onAllow={() => undefined} onRetry={() => undefined} />,
    );
    expect(downloading).toContain("Downloading the latest Family Records.");

    const permission = renderToStaticMarkup(
      <AppUpdateBanner phase={{ phase: "permission" }} onAllow={() => undefined} onRetry={() => undefined} />,
    );
    expect(permission).toContain("Allow Family Records to install updates.");
    expect(permission).toContain("Allow installs");

    const failed = renderToStaticMarkup(
      <AppUpdateBanner phase={{ phase: "failed", message: "The update could not be installed." }} onAllow={() => undefined} onRetry={() => undefined} />,
    );
    expect(failed).toContain("The update could not be installed.");
    expect(failed).toContain("Try again");
  });
});
