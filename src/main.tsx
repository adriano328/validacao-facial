import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Amplify } from 'aws-amplify'
import '@aws-amplify/ui-react/styles.css'

Amplify.configure({
    Auth: {
        Cognito: {
            identityPoolId: 'us-east-1:4949e786-6c75-43c1-9d3d-01872c303faf',
            allowGuestAccess: true
        }
    }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
