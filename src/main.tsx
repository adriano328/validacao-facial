import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// ✅ CSS GLOBAL (AGORA DENTRO DE app/styles)
import "./app/styles/globalStyles.css";
import "./app/styles/swal.css";

// ✅ AWS
import "@aws-amplify/ui-react/styles.css";
import "@aws-amplify/ui-react-liveness/styles.css";
import { Amplify } from "aws-amplify";
import { I18n } from "aws-amplify/utils";

// ✅ CONTEXTOS
import { AuthTokenProvider } from "./context/AuthTokenContext";
import { PessoaProvider } from "./context/PessoaContext";
import { TwoFactorProvider } from "./context/TwoFactorContext";

// ✅ I18N
import "./i18n/livenessPtBR";

// ✅ APP
import App from "./App";

// ==========================
// CONFIGURAÇÕES
// ==========================

I18n.setLanguage("pt");

Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: "us-east-1:4949e786-6c75-43c1-9d3d-01872c303faf",
      allowGuestAccess: true,
    },
  },
});

// ==========================
// RENDER
// ==========================

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