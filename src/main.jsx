import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/buttons.css";
import "./styles/layout.css";
import "./styles/home.css";
import "./styles/forms.css";
import "./styles/voucher.css";
import "./styles/print.css";
import "./styles/challan.css";
import "./styles/insights.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
