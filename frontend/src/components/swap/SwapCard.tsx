import React, { ReactNode } from "react";
import "../../css/hideNumberArrows.css";

interface SwapCardProps {
  label: string;
  icon: ReactNode;
  token: string;
  valueAmount: number;
  handleChange: (e: any) => void;
  addMaxBalance?: ReactNode;
  isError?: boolean;
}

const SwapCard = ({
  label,
  icon,
  token,
  valueAmount,
  handleChange,
  addMaxBalance,
  isError,
}: SwapCardProps) => {
  return (
    <>
      <div
        className={
          isError
            ? "border-[0.5px] rounded-lg px-4 py-2 bg-base-300 border-red-600 w-96"
            : "border-[0.5px] rounded-lg px-4 py-2 bg-base-300 border-gray-600 w-96"
        }
      >
        <div className="flex items-center justify-between">
          <span
            className={
              isError ? "text-sm text-red-500" : "text-sm text-gray-400"
            }
          >
            {label}
          </span>
          {addMaxBalance && addMaxBalance}
        </div>
        <div className="flex flex-row items-end justify-between mt-4 mb-1">
          <div>
            <input
              className={
                isError
                  ? "text-2xl text-red-500 bg-base-300 border-none outline-none w-full"
                  : "text-2xl text-gray-400 bg-base-300 border-none outline-none w-full placeholder:text-gray-600"
              }
              value={valueAmount}
              placeholder="0"
              onChange={handleChange}
              type="number"
            />
          </div>
          <div className="flex gap-1.5">
            <div className="w-8 h-8">{icon}</div>
            <div>
              <p className="text-2xl text-gray-400 select-none">{token}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SwapCard;
