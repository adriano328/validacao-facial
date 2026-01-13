// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './app/pages/validacao/App2'
// import { Amplify } from 'aws-amplify'
// import '@aws-amplify/ui-react/styles.css'

// Amplify.configure({
//     Auth: {
//         Cognito: {
//             identityPoolId: 'us-east-1:4949e786-6c75-43c1-9d3d-01872c303faf',
//             allowGuestAccess: true
//         }
//     }
// })

// ReactDOM.createRoot(document.getElementById('root')!).render(
//     <React.StrictMode>
//         <App />
//     </React.StrictMode>
// )

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/globalStyles.css";
import App from "./app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
