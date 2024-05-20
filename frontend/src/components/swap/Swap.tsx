import { useWallet } from "@solana/wallet-adapter-react";
import React, { useEffect, useState } from "react";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import SwapCard from "./SwapCard";
import solanaLogo from "../../assets/images/Solana-Logo.png";
import Image from "next/image";
import SwapButton from "../buttons/SwapButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faGear,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import delay from "@/helpers/delay";
import SettingsModal from "../modals/SettingsModal";
import useSettings from "@/hooks/useSettings";
import { useWalletMultiButton } from "@solana/wallet-adapter-base-ui";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface SwapProps {
  props?: any;
}

const Swap = ({ props }: SwapProps) => {
  const { wallet, connect, disconnect, connected, publicKey } = useWallet();

  const { network } = useSettings();

  const [solBalance, setSolBalance] = useState<number>(0);

  const [totalSolStaked, setTotalSolStaked] = useState<number>(0.0001);

  const [stakingAmount, setStakingAmount] = useState<number>(0);

  const [receivingAmount, setReceivingAmount] = useState<number>(0);

  const [isError, setIsError] = useState<boolean>(false);

  const [error, setError] = useState<string>("");

  const [currentDarkSolRate, setCurrentDarkSolRate] = useState<number>(1);

  const [isFetching, setIsFetching] = useState<boolean>(false);

  const { setVisible: setModalVisible } = useWalletModal();

  const [buttonLabel, setButtonLabel] = useState<string>("Connect Wallet");

  const { buttonState, onConnect, onDisconnect, walletIcon, walletName } =
    useWalletMultiButton({
      onSelectWallet() {
        setModalVisible(true);
      },
    });

  const fetchData = () => {
    if (publicKey) {
      const connection = new Connection(clusterApiUrl(network), "confirmed");
      connection.getBalance(publicKey).then((balance: number) => {
        setSolBalance(balance / 1e9);
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [publicKey]);

  const handleSwapButtonClick = () => {};

  const handleStakingChange = (e: any) => {
    const { value } = e.target;
    setStakingAmount(value);
  };

  useEffect(() => {
    setReceivingAmount(stakingAmount * currentDarkSolRate);
    if (stakingAmount > solBalance) {
      setIsError(true);
      setError("Not enough SOL");
    } else {
      setError("");
      setIsError(false);
    }
  }, [stakingAmount]);

  const handleClickRefresh = async () => {
    setIsFetching(true);
    fetchData();
    await delay(2000);
    setIsFetching(false);
  };

  const handleClickSettings = () => {
    const modal: any = document?.getElementById("my_modal_5");
    modal.showModal();
  };

  const handleMaxClick = () => {
    setStakingAmount(solBalance);
  };

  useEffect(() => {
    if (!connected) {
      setButtonLabel("Connect Wallet");
    } else if (stakingAmount === 0) {
      setButtonLabel("Enter an amount");
    } else if (isError) {
      setButtonLabel("Insufficient balance");
    } else {
      setButtonLabel("Stake");
    }
  }, [connected, stakingAmount, isError]);

  return (
    <>
      <div className="flex items-center justify-center flex-col columns-1 px-4">
        <div className="my-2 flex items-center justify-center">
          <h1 className="text-2xl text-purple-500 font-semibold">
            Get darkSOL
          </h1>
        </div>
        <div className="w-full xs:w-1/3 sm:w-1/2 mb-1">
          <p className="text-center text-sm text-gray-400">
            Stake SOL to receive darkSOL, a liquid staking token which
            accumulates rewards from Solana validators.
          </p>
        </div>
        <div className="my-2">
          <div className="border-[0.5px] rounded-lg px-3 py-2 bg-base-300 border-gray-600">
            <p className="text-xs text-gray-500">
              Total Staked SOL -
              <span className="text-purple-500 font-medium">{` ${totalSolStaked} `}</span>
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between w-96 ">
          <div className="tooltip tooltip-top" data-tip="Refresh">
            <div
              className="h-8 w-8 rounded-full bg-base-300 flex items-center justify-center border-gray-700 border cursor-pointer"
              onClick={handleClickRefresh}
            >
              <FontAwesomeIcon
                icon={faArrowsRotate}
                className={
                  isFetching
                    ? "text-xs text-gray-400 animate-spin"
                    : "text-xs text-gray-400"
                }
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400">
              1 darkSol = {1 * currentDarkSolRate} SOL
            </p>
          </div>
          <div className="tooltip tooltip-top" data-tip="Settings">
            <div
              className="h-8 w-8 rounded-full bg-base-300 flex items-center justify-center border-gray-700 border cursor-pointer"
              onClick={handleClickSettings}
            >
              <FontAwesomeIcon
                icon={faGear}
                className="text-xs text-gray-400"
              />
            </div>
            <SettingsModal />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center flex-col gap-2">
          <SwapCard
            label={error.length ? error : "You're staking"}
            token="SOL"
            valueAmount={stakingAmount}
            handleChange={handleStakingChange}
            icon={<Image src={solanaLogo} alt="Solana Logo" />}
            isError={isError}
            addMaxBalance={
              solBalance > 0 ? (
                <div className="flex flex-row text-xs text-gray-400 items-center justify-center gap-1">
                  <FontAwesomeIcon icon={faWallet} />
                  <span>{`${solBalance} SOL`}</span>
                  <div>
                    <button
                      className="rounded-full border-gray-400 border-[0.5px] px-1.5 py-0.5 font-light text-[8px]"
                      onClick={handleMaxClick}
                    >
                      MAX
                    </button>
                  </div>
                </div>
              ) : null
            }
          />
          <SwapCard
            label="To Recieve"
            token="darkSOL"
            valueAmount={receivingAmount}
            handleChange={() => {}}
            icon={
              <div className="bg-black rounded-full w-8 h-8 flex items-center justify-center">
                <span className="text-xl ">🔮</span>
              </div>
            }
          />
          <SwapButton label={buttonLabel} onClick={handleSwapButtonClick} />
        </div>
      </div>
    </>
  );
};

export default Swap;
