import React from "react";
import ReactDOM from "react-dom/client";

import "@shared/styles/globalStyles.css";
import "@aws-amplify/ui-react/styles.css";
import "@aws-amplify/ui-react-liveness/styles.css";
import "@shared/styles/swal.css";
import "@features/liveness/config/livenessPtBR";

import App from "@app/App";
import { configureAmplify } from "@app/config/amplify";
import { AppProviders } from "@app/providers/AppProviders";

configureAmplify();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
