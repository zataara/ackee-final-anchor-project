import React from "react";
import { PropsWithChildren } from "react";
import WalletAppProvider from "./WalletAppProvider";
import { SettingsProvider } from "@/contexts/SettingsContext";

interface AppProviderProps {}

const ApplicationProvider = ({
  children,
}: PropsWithChildren<AppProviderProps>) => (
  <SettingsProvider>
    <WalletAppProvider>{children}</WalletAppProvider>
  </SettingsProvider>
);

export default ApplicationProvider;
