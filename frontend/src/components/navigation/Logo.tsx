import React from "react";

interface LogoProps {
  props?: any;
}

const Logo = ({ props }: LogoProps) => {
  return (
    <>
      <h1 className="text-3xl font-bold items-center flex gap-3">
        <span className="bg-base-100 rounded-full p-2 w-12 h-12">🔮</span>
        <span className="bg-gradient-to-r to-cyan-400 from-purple-500 select-none text-transparent bg-clip-text ">
          darkSOL
        </span>
      </h1>
    </>
  );
};

export default Logo;
