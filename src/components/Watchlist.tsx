import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Plus, X, Search } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useUser } from "../context/UserContext";

type StockData = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  up: boolean;
};

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, x: 0, 
    transition: { type: "tween", duration: 0.3, ease: "easeOut" } 
  },
};

export const Watchlist = ({ onNavigate }: { onNavigate?: (symbol: string) => void }) => {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState("");
  const [adding, setAdding] = useState(false);
  const { getCurrencySymbol, profile, updateProfile } = useUser();
  const watchlist = profile.watchlist || ["AAPL", "TSLA", "MSFT", "NVDA", "BTC-USD"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = watchlist.map(symbol => 
          fetch(`/api/finance/v8/finance/chart/${symbol}?interval=1d&range=1d`).then(r => r.json()).catch(() => null)
        );
        const results = await Promise.all(promises);
        
        const formattedData = results.map((json, i) => {
          const sym = watchlist[i];
          if (json && json.chart && json.chart.result && json.chart.result[0]) {
            const meta = json.chart.result[0].meta;
            if (!meta) return null;
            const currentPrice = meta.regularMarketPrice;
            const prevClose = meta.chartPreviousClose || currentPrice;
            const changePercent = ((currentPrice - prevClose) / prevClose) * 100;
            return {
              symbol: meta.symbol,
              name: meta.symbol,
              price: `${getCurrencySymbol()}${currentPrice.toFixed(2)}`,
              change: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
              up: changePercent >= 0,
            };
          }
          return null;
        }).filter(item => item !== null) as StockData[];
        
        setData(formattedData);
      } catch (error) {
        console.error("Error fetching Yahoo finance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30 seconds refresh
    return () => clearInterval(interval);
  }, [watchlist.join(',')]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    const sym = newSymbol.toUpperCase().trim();
    if (watchlist.includes(sym)) {
      setNewSymbol("");
      return;
    }
    setAdding(true);
    await updateProfile({ watchlist: [...watchlist, sym] });
    setNewSymbol("");
    setAdding(false);
  };

  const handleRemove = async (e: React.MouseEvent, symToRemove: string) => {
    e.stopPropagation();
    await updateProfile({ watchlist: watchlist.filter(s => s !== symToRemove) });
  };

  return (
    <div className="w-full h-full flex flex-col">
      <form onSubmit={handleAdd} className="mb-4 flex items-center gap-2 relative z-10">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Add symbol (e.g. AMZN)" 
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            className="w-full bg-[#1a1a24] border border-border text-white text-sm rounded-lg py-2.5 pl-9 pr-3 outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <button type="submit" disabled={adding} className="p-2.5 bg-primary/20 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50">
          <Plus size={18} />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {loading && data.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <motion.div 
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2 pb-2"
          >
            {data.map((item) => (
              <motion.div
                key={item.symbol}
                variants={itemVariants}
                onClick={() => onNavigate && onNavigate(item.symbol)}
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-[#1a1a24] cursor-pointer border border-transparent hover:border-border transition-all relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${item.up ? 'bg-success/10 text-success' : 'bg-red-500/10 text-red-500'}`}>
                    {item.symbol[0]}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{item.symbol}</h4>
                  </div>
                </div>

                <div className="flex flex-col items-end group-hover:pr-8 transition-all">
                  <span className="text-white font-bold">{item.price}</span>
                  <span className={`text-xs font-semibold flex items-center ${item.up ? 'text-success' : 'text-danger'}`}>
                    {item.up ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                    {item.change}
                  </span>
                </div>

                <button 
                  onClick={(e) => handleRemove(e, item.symbol)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-all"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
            {data.length === 0 && !loading && (
              <div className="text-center text-neutral-500 text-sm mt-4">
                Watchlist is empty
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
