"use client";

import { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
require("@solana/wallet-adapter-react-ui/styles.css");
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import useSettings from "@/hooks/useSettings";

export const WalletContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  const { rpcURL } = useSettings();

  console.log({rpcURL})

  return (
    <ConnectionProvider endpoint={rpcURL}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;
