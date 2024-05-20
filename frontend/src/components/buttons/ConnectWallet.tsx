"use client";

/* eslint-disable react-hooks/exhaustive-deps */

import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletMultiButton } from "@solana/wallet-adapter-base-ui";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowsRotate,
  faPlugCircleXmark,
} from "@fortawesome/free-solid-svg-icons";

interface ConnectWalletProps {
  children?: ReactNode;
}

const ConnectWallet = ({ children }: ConnectWalletProps) => {
  const { wallet, connect, disconnect, connected, publicKey } = useWallet();

  const { setVisible: setModalVisible } = useWalletModal();

  const labels = {
    "change-wallet": "Change wallet",
    connecting: "Connecting",
    "copy-address": "Copy address",
    copied: "Copied",
    disconnect: "Disconnect",
    "has-wallet": "Connect",
    "no-wallet": "Connect Wallet",
  } as const;

  const { buttonState, onConnect, onDisconnect, walletIcon, walletName } =
    useWalletMultiButton({
      onSelectWallet() {
        setModalVisible(true);
      },
    });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (wallet && !connected) {
      connect().catch((error) => {
        console.error("Failed to connect wallet", error);
      });
    }
  }, [wallet, connect]);

  const content = useMemo(() => {
    if (children) {
      return children;
    } else if (publicKey) {
      const base58 = publicKey.toBase58();
      return base58.slice(0, 4) + "..." + base58.slice(-4);
    } else if (buttonState === "connecting" || buttonState === "has-wallet") {
      return labels[buttonState];
    } else {
      return labels["no-wallet"];
    }
  }, [buttonState, children, labels, publicKey]);

  const handleClickWallet = () => {
    switch (buttonState) {
      case "no-wallet":
        setModalVisible(true);
        break;
      case "has-wallet":
        if (onConnect) {
          onConnect();
        }
        break;
      case "connected":
        // setMenuOpen(true);
        break;
    }
  };

  return (
    <>
      <details className="dropdown dropdown-end">
        <summary
          onClick={handleClickWallet}
          className="relative inline-block p-[1px] bg-gradient-to-r from-cyan-400 to-purple-500 rounded-md cursor-pointer mb-0.5"
        >
          <div
            className={
              buttonState === "connected"
                ? "btn bg-base-100 text-gray-100 rounded-md "
                : "btn bg-transparent hover:bg-transparent border-none text-black  rounded-md"
            }
          >
            {walletIcon && walletName && buttonState !== "connecting" && (
              <Image
                alt={`${walletName} Icon`}
                src={walletIcon}
                width={20}
                height={20}
              />
            )}
            {buttonState === "connecting" && (
              <span className="loading loading-spinner w-5 h-5"></span>
            )}
            <span>{content}</span>
          </div>
        </summary>
        {buttonState === "connected" && (
          <ul
            className={
              "px-2 py-1 w-48 shadow menu dropdown-content z-[1] bg-base-300 rounded-box text-gray-300"
            }
          >
            {publicKey && (
              <li
                className="flex flex-row items-center justify-between w-full h-12"
                onClick={async () => {
                  await navigator.clipboard.writeText(publicKey.toBase58());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 400);
                }}
              >
                <span className="w-full flex items-center justify-between">
                  {copied ? labels["copied"] : labels["copy-address"]}
                  <FontAwesomeIcon icon={faCopy} className="" />
                </span>
              </li>
            )}
            <li
              className="flex flex-row items-center justify-between w-full h-12"
              onClick={() => {
                setModalVisible(true);
              }}
            >
              <span className="w-full flex items-center justify-between">
                {labels["change-wallet"]}
                <FontAwesomeIcon icon={faArrowsRotate} />
              </span>
            </li>
            {onDisconnect ? (
              <li
                className="flex flex-row items-center justify-between w-full h-12"
                onClick={() => {
                  onDisconnect();
                }}
              >
                <span className="w-full flex items-center justify-between">
                  {labels["disconnect"]}
                  <FontAwesomeIcon icon={faPlugCircleXmark} />
                </span>
              </li>
            ) : null}
          </ul>
        )}
      </details>
    </>
  );
};

export default ConnectWallet;
