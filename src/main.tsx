import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/quicksand/latin-700.css";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import { Capacitor } from "@capacitor/core";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { prepareNativeShell } from "./native/platform";
import "./index.css";

if (import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  registerSW({ immediate: true });
}

prepareNativeShell();

const root = document.getElementById("root");
if (!root) {
  throw new Error("Family Records could not find the root element.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
