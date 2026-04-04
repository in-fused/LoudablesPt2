import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/variables.css";
import "./styles/app.css";
import { registerServiceWorker } from "./features/pwa/registerServiceWorker";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerServiceWorker();
