import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const defaultSymbols = ["MSFT", "GOOGL", "AMZN", "META", "AAPL"];

type StockData = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  up: boolean;
};
import { useUser } from "../context/UserContext";

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
  const { getCurrencySymbol } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const symbolNames: Record<string, string> = {
          "MSFT": "Microsoft",
          "GOOGL": "Alphabet",
          "AMZN": "Amazon",
          "META": "Meta",
          "AAPL": "Apple Inc."
        };

        const promises = defaultSymbols.map(symbol => 
          fetch(`/api/finance/v8/finance/chart/${symbol}?interval=1d&range=1d`).then(r => r.json())
        );
        const results = await Promise.all(promises);
        
        const formattedData = results.map(json => {
          if (json.chart && json.chart.result) {
            const meta = json.chart.result[0].meta;
            const currentPrice = meta.regularMarketPrice;
            const prevClose = meta.chartPreviousClose;
            const changePercent = ((currentPrice - prevClose) / prevClose) * 100;
            return {
              symbol: meta.symbol,
              name: symbolNames[meta.symbol] || meta.symbol,
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
  }, []);

  return (
    <div className="w-full h-full flex flex-col pt-2">
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between items-center p-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-800" />
                  <div>
                    <div className="h-4 w-16 bg-neutral-800 rounded mb-2" />
                    <div className="h-3 w-24 bg-neutral-800 rounded" />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="h-4 w-12 bg-neutral-800 rounded mb-2" />
                  <div className="h-3 w-10 bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            variants={listVariants} 
            initial="hidden" 
            animate="visible"
            className="space-y-2"
          >
            {data.map((item) => (
              <motion.div 
                key={item.symbol} 
                layout
                variants={itemVariants}
                whileHover={{ scale: 1.02, backgroundColor: "#1a1a24" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate && onNavigate(item.symbol)}
                transition={{ type: "tween", duration: 0.2 }}
                className="flex justify-between items-center cursor-pointer p-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#16161e] shadow-inner flex items-center justify-center font-bold text-sm text-neutral-300 border border-border">
                    {item.symbol[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{item.symbol}</p>
                    <p className="text-xs text-neutral-400 truncate w-32">{item.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <motion.p 
                    key={item.price} 
                    initial={{ opacity: 0.5, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="font-bold text-white text-sm"
                  >
                    {item.price}
                  </motion.p>
                  <p className={`text-xs flex items-center justify-end gap-1 font-medium ${item.up ? 'text-success' : 'text-danger'}`}>
                    {item.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {item.change}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <motion.button 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 py-2 border border-border rounded-lg text-sm text-neutral-300 hover:bg-white hover:text-black transition-colors duration-300"
      >
        View All Markets
      </motion.button>
    </div>
  );
};
