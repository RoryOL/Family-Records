import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/quicksand/latin-700.css";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Kinfolk could not find the root element.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
