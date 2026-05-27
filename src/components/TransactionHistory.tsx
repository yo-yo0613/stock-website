import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTransactions } from "../context/TransactionContext";
import { useUser } from "../context/UserContext";
import { ArrowDownToLine, ArrowUpFromLine, ShoppingCart, DollarSign, Maximize2, Minimize2, History } from "lucide-react";

export const TransactionHistory = () => {
  const { transactions } = useTransactions();
  const { getCurrencySymbol } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return <ArrowDownToLine size={16} className="text-success" />;
      case 'WITHDRAW': return <ArrowUpFromLine size={16} className="text-red-500" />;
      case 'BUY': return <ShoppingCart size={16} className="text-blue-500" />;
      case 'SELL': return <DollarSign size={16} className="text-purple-500" />;
      default: return <History size={16} className="text-muted-foreground" />;
    }
  };

  const containerClasses = isExpanded 
    ? "fixed inset-4 z-[200] bg-card border border-border shadow-2xl rounded-2xl p-6 flex flex-col overflow-hidden" 
    : "bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col relative h-[350px] overflow-hidden";

  return (
    <>
      {isExpanded && <div className="h-[350px] w-full rounded-2xl border border-dashed border-border/50 bg-card-hover/20" />}
      
      <motion.div 
        layout
        className={containerClasses}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <History size={20} />
            </div>
            <h3 className="text-foreground font-medium">Transaction Log</h3>
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center p-2 bg-card-hover hover:bg-muted text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
            title={isExpanded ? "Minimize" : "Expand Fullscreen"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="flex flex-col gap-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-card-hover rounded-xl border border-border/50 hover:border-border transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border">
                    {getIcon(tx.type)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">
                      {tx.type === 'DEPOSIT' || tx.type === 'WITHDRAW' ? 'Cash Transfer' : tx.asset}
                    </span>
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      {tx.type} {tx.shares ? `· ${tx.shares} SHARES` : ''}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-success' : 'text-foreground'}`}>
                    {tx.amount > 0 ? '+' : ''}{getCurrencySymbol()}{Math.abs(tx.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <History size={32} className="mb-2 opacity-20" />
                <span className="text-sm">No recent transactions</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};
