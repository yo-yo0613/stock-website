import { Wallet, ArrowUpRight, Building2, Briefcase, Landmark } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useTransactions } from "../context/TransactionContext";

export const PortfolioStats = () => {
  const { getCurrencySymbol, profile } = useUser();
  const { totalBalance, cashBalance, portfolioValue, addTransaction } = useTransactions();

  const handleDeposit = () => {
    addTransaction({
      type: 'DEPOSIT',
      amount: 100000,
      asset: 'USD'
    });
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
        
        <button 
          onClick={handleDeposit}
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-success/20 text-success hover:bg-success hover:text-white rounded-lg transition-all text-xs font-semibold border border-success/30"
          title="Simulate Bank Deposit"
        >
          <Landmark size={14} />
          <span>Connect Bank</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            {getCurrencySymbol()}{totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex items-center text-success bg-success/10 px-2 py-1 rounded text-xs font-semibold">
              <ArrowUpRight size={14} className="mr-1" />
              +{(profile.stats?.profit || 12.5).toFixed(1)}%
            </span>
            <span className="text-muted-foreground text-sm">vs last month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="flex items-center justify-between p-3 bg-card-hover rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Cash</span>
              <span className="text-sm font-bold text-foreground">{getCurrencySymbol()}{cashBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-card-hover rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <Briefcase size={18} className="text-purple-500" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Portfolio</span>
              <span className="text-sm font-bold text-foreground">{getCurrencySymbol()}{portfolioValue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
