import React from "react";
// import ConnectWallet from "";
import Logo from "./Logo";
import dynamic from 'next/dynamic'

const ConnectWallet = dynamic(() => import("../buttons/ConnectWallet"), { ssr: false })

interface HeaderNavProps {
  props?: any;
}

const HeaderNav = ({ props }: HeaderNavProps) => {
  return (
    <>
      <div className="bg-base-300 py-2 flex items-center justify-between px-8">
        <Logo />
        <ConnectWallet />
      </div>
    </>
  );
};

export default HeaderNav;
