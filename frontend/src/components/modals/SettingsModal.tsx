import React from "react";
import useSettings from "@/hooks/useSettings";
import { Network } from "@/contexts/SettingsContext";

const SettingsModal = () => {
  const { network, setNetwork, rpcURL, setRpcURL } = useSettings();

  const handleNetworkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedNetwork = event.target.value as Network;
    // console.log({selectedNetwork})
    setNetwork(selectedNetwork);
    let newRpcUrl = "";
    switch (selectedNetwork) {
      case "mainnet-beta":
        newRpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || "";
        break;
      case "testnet":
        newRpcUrl = process.env.NEXT_PUBLIC_TESTNET_RPC_URL || "";
        break;
      case "devnet":
        newRpcUrl = process.env.NEXT_PUBLIC_DEVNET_RPC_URL || "";
        break;
      default:
        newRpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || "";
    }
    setRpcURL(newRpcUrl);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Selected Network:", network);
    console.log("Selected RPC URL:", rpcURL);
    const modal = document.getElementById("my_modal_5") as HTMLDialogElement;
    modal.close();
  };

  return (
    <>
      <dialog id="my_modal_5" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <div className="flex flex-col columns-1 gap-2 items-center">
            <h1 className="text-gray-400 text-xl">Network</h1>
            <div className="divider"></div>

            <div className="flex flex-row gap-2 w-24">
              <input
                id="network-mainnet"
                type="radio"
                name="network"
                value="mainnet-beta"
                checked={network === "mainnet-beta"}
                onChange={handleNetworkChange}
                className="radio radio-secondary"
              />
              <label
                htmlFor="network-mainnet"
                className="text-gray-400 select-none"
              >
                Mainnet
              </label>
            </div>
            <div className="flex flex-row gap-2 w-24">
              <input
                id="network-devnet"
                type="radio"
                name="network"
                value="devnet"
                checked={network === "devnet"}
                onChange={handleNetworkChange}
                className="radio radio-secondary"
              />
              <label
                htmlFor="network-devnet"
                className="text-gray-400 select-none"
              >
                Devnet
              </label>
            </div>
            <div className="flex flex-row gap-2 w-24">
              <input
                id="network-testnet"
                type="radio"
                name="network"
                value="testnet"
                checked={network === "testnet"}
                onChange={handleNetworkChange}
                className="radio radio-secondary"
              />
              <label
                htmlFor="network-testnet"
                className="text-gray-400 select-none"
              >
                Testnet
              </label>
            </div>
          </div>
          <div className="modal-action w-full flex items-center justify-center">
            <form onSubmit={handleSubmit}>
              <button type="submit" className="btn btn-sm w-24">
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default SettingsModal;
