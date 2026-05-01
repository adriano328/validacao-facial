import { Amplify } from "aws-amplify";
import { I18n } from "aws-amplify/utils";

export function configureAmplify() {
  I18n.setLanguage("pt");

  Amplify.configure({
    Auth: {
      Cognito: {
        identityPoolId:
          import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID ??
          "us-east-1:4949e786-6c75-43c1-9d3d-01872c303faf",
        allowGuestAccess: true,
      },
    },
  });
}
