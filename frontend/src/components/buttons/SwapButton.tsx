import React from "react";

interface SwapButtonProps {
  label: string;
  onClick: () => void;
}

const SwapButton = ({ label, onClick }: SwapButtonProps) => {
  return (
    <>
      <button
        className="btn bg-gradient-to-r to-cyan-400 from-purple-500 select-none btn-sm w-full text-black"
        onClick={onClick}
      >
        {label}
      </button>
    </>
  );
};

export default SwapButton;
