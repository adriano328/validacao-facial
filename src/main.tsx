import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/globalStyles.css";
import "@aws-amplify/ui-react/styles.css";
import "@aws-amplify/ui-react-liveness/styles.css";
import { Amplify } from "aws-amplify";
import "./styles/swal.css";
import { PessoaProvider } from "./context/PessoaContext";

import { I18n } from "aws-amplify/utils";
import "./i18n/livenessPtBR"; // ✅ troque para este arquivo
import { TwoFactorProvider } from "./context/TwoFactorContext";
import { AuthTokenProvider } from "./context/AuthTokenContext";
import App from "./app";

I18n.setLanguage("pt"); // ✅ troque pt-BR por pt

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
