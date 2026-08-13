import React from "react";
import ReactDOM from "react-dom/client";

import "@shared/styles/globalStyles.css";
import "@shared/styles/swal.css";

import App from "@app/App";
import { AppProviders } from "@app/providers/AppProviders";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
