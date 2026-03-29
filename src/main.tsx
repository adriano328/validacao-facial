import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { I18n } from "aws-amplify/utils";

import "./styles/globalStyles.css";
import "@aws-amplify/ui-react/styles.css";
import "@aws-amplify/ui-react-liveness/styles.css";
import "./styles/swal.css";
import "./i18n/livenessPtBR";

import { PessoaProvider } from "./context/PessoaContext";
import { TwoFactorProvider } from "./context/TwoFactorContext";
import { AuthTokenProvider } from "./auth/AuthTokenContext";
import App from "./App";

I18n.setLanguage("pt");

Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: "us-east-1:4949e786-6c75-43c1-9d3d-01872c303faf",
      allowGuestAccess: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthTokenProvider>
      <PessoaProvider>
        <TwoFactorProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TwoFactorProvider>
      </PessoaProvider>
    </AuthTokenProvider>
  </React.StrictMode>,
);