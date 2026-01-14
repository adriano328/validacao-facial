import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/globalStyles.css";
import App from "./app";
import { Amplify } from "aws-amplify";

Amplify.configure({
    Auth: {
        Cognito: {
            identityPoolId: 'us-east-1:4949e786-6c75-43c1-9d3d-01872c303faf',
            allowGuestAccess: true
        }
    }
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
