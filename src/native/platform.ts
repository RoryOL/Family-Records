import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { listenForAuthLinks } from "./authLink";

export function prepareNativeShell(): void {
  if (!Capacitor.isNativePlatform()) return;
  listenForAuthLinks();
  void StatusBar.setOverlaysWebView({ overlay: false });
  void StatusBar.setBackgroundColor({ color: "#fafaf9" });
  void StatusBar.setStyle({ style: Style.Light });
  void App.addListener("backButton", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    void App.exitApp();
  });
}
