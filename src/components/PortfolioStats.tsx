import { Wallet, ArrowUpRight, Activity, Edit2, Check, X } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useState } from "react";

export const PortfolioStats = () => {
  const { getCurrencySymbol, profile, updateProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [balance, setBalance] = useState(profile.stats?.balance || 124562);
  const [profit, setProfit] = useState(profile.stats?.profit || 12.5);

  const handleSave = () => {
    updateProfile({
      stats: {
        ...profile.stats,
        balance: Number(balance) || 0,
        profit: Number(profit) || 0
      }
    });
    setIsEditing(false);
  };
  
  return (
    <div className="w-full h-full flex flex-col justify-between py-2 relative group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Wallet size={20} />
          </div>
          <h3 className="text-foreground font-medium">Total Balance</h3>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-foreground bg-neutral-800 rounded transition-all">
            <Edit2 size={14} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} className="p-1 text-success hover:bg-success/20 rounded transition-colors"><Check size={16} /></button>
            <button onClick={() => setIsEditing(false)} className="p-1 text-red-500 hover:bg-red-500/20 rounded transition-colors"><X size={16} /></button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{getCurrencySymbol()}</span>
              <input 
                type="number" 
                value={balance} 
                onChange={(e) => setBalance(Number(e.target.value))}
                className="bg-card-hover text-2xl font-bold text-foreground border border-border outline-none rounded p-1 w-full" 
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center text-success bg-success/10 px-2 py-1 rounded text-xs font-semibold">
                <ArrowUpRight size={14} className="mr-1" />
                <input 
                  type="number" 
                  value={profit} 
                  onChange={(e) => setProfit(Number(e.target.value))}
                  className="bg-transparent text-success outline-none w-16" 
                /> %
              </span>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">{getCurrencySymbol()}{(profile.stats?.balance || 124562).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center text-success bg-success/10 px-2 py-1 rounded text-xs font-semibold">
                <ArrowUpRight size={14} className="mr-1" />
                +{(profile.stats?.profit || 12.5).toFixed(1)}%
              </span>
              <span className="text-muted-foreground text-sm">vs last month</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 p-3 bg-card-hover rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <Activity size={18} className="text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Active Positions</span>
        </div>
        <span className="text-foreground font-bold">{profile.stats?.positions || 14}</span>
      </div>
    </div>
  );
};
