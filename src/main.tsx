import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./app/styles/globalStyles.css";
import "./app/styles/swal.css";
import "@aws-amplify/ui-react/styles.css";
import "@aws-amplify/ui-react-liveness/styles.css";
import { Amplify } from "aws-amplify";
import { I18n } from "aws-amplify/utils";

import { AuthTokenProvider } from "./app/providers/auth-token-provider";
import { PessoaProvider } from "./app/providers/pessoa-provider";
import { TwoFactorProvider } from "./app/providers/two-factor-provider";
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
  </React.StrictMode>
);