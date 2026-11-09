import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/home.css";
import "./styles/forms.css";
import "./styles/voucher.css";
import "./styles/print.css";
import "./styles/challan.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
