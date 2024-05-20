import { Cluster } from "@solana/web3.js";
import {
  PropsWithChildren,
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";

export type Network = "mainnet-beta" | "testnet" | "devnet";

interface SettingsContextValue {
  network: Network;
  setNetwork: Dispatch<SetStateAction<Network>>;
  rpcURL: string; // Use string for the RPC URL
  setRpcURL: Dispatch<SetStateAction<string>>;
}

const defaultState: SettingsContextValue = {
  network: "mainnet-beta",
  setNetwork: () => {},
  rpcURL: `https://mainnet.helius-rpc.com/?api-key=b7e29d63-e77d-4f9c-89b9-446dc05aa46c`,
  setRpcURL: () => {},
};

export const SettingsContext = createContext<SettingsContextValue>(defaultState);

interface SettingsContextProps {}

export const SettingsProvider = ({ children }: PropsWithChildren<SettingsContextProps>) => {
  const [network, setNetwork] = useState<Network>(() => {
    const savedNetwork = localStorage.getItem("network");
    return savedNetwork ? (savedNetwork as Network) : "mainnet-beta";
  });

  const [rpcURL, setRpcURL] = useState<string>(() => {
    const savedRpcURL = localStorage.getItem("rpcURL");
    return savedRpcURL ? savedRpcURL : defaultState.rpcURL;
  });

  useEffect(() => {
    localStorage.setItem("network", network);
  }, [network]);

  useEffect(() => {
    localStorage.setItem("rpcURL", rpcURL);
  }, [rpcURL]);

  return (
    <SettingsContext.Provider value={{ network, setNetwork, rpcURL, setRpcURL }}>
      {children}
    </SettingsContext.Provider>
  );
};
