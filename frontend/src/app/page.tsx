"use client";

import HeaderNav from "@/components/navigation/HeaderNav";
import Swap from "@/components/swap/Swap";
import ApplicationProvider from "@/provider";

export default function Home() {
  return (
    <>
      <ApplicationProvider>
        <div>
          <HeaderNav />
        </div>
        <div className="bg-base-200 h-screen">
          <div className="flex w-full items-start justify-center">
            <div>
              <Swap />
            </div>
            <div>
              
            </div>
          </div>
        </div>
      </ApplicationProvider>
    </>
  );
}
