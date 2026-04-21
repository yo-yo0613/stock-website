import { Wallet, ArrowUpRight, Activity } from "lucide-react";
import { useUser } from "../context/UserContext";

export const PortfolioStats = () => {
  const { getCurrencySymbol } = useUser();
  
  return (
    <div className="w-full h-full flex flex-col justify-between py-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary/20 rounded-lg text-primary">
          <Wallet size={20} />
        </div>
        <h3 className="text-white font-medium">Total Balance</h3>
      </div>
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight">{getCurrencySymbol()}124,562.00</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="flex items-center text-success bg-success/10 px-2 py-1 rounded text-xs font-semibold">
            <ArrowUpRight size={14} className="mr-1" />
            +12.5%
          </span>
          <span className="text-neutral-500 text-sm">vs last month</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-6 p-3 bg-[#1a1a24] rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <Activity size={18} className="text-primary" />
          <span className="text-sm font-medium text-neutral-300">Active Positions</span>
        </div>
        <span className="text-white font-bold">14</span>
      </div>
    </div>
  );
};
