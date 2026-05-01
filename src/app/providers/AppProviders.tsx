import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";

import { AuthFlowProvider } from "@features/auth/model/AuthFlowContext";
import { AuthTokenProvider } from "@features/auth/model/AuthTokenContext";
import { TwoFactorProvider } from "@features/two-factor/model/TwoFactorContext";
import { UserInfoProvider } from "@features/user/model/UserInfoContext";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthTokenProvider>
      <AuthFlowProvider>
        <TwoFactorProvider>
          <BrowserRouter>
            <UserInfoProvider>{children}</UserInfoProvider>
          </BrowserRouter>
        </TwoFactorProvider>
      </AuthFlowProvider>
    </AuthTokenProvider>
  );
}
