import { useState, useEffect } from "react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useUser } from "../context/UserContext";

type ChartPoint = { time: string; price: number };

export const StockChart = ({ onNavigate }: { onNavigate?: () => void }) => {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [meta, setMeta] = useState({ price: 0, change: 0, symbol: "AAPL", name: "Apple Inc." });
  const [loading, setLoading] = useState(true);
  const { getCurrencySymbol } = useUser();

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await fetch('/api/finance/v8/finance/chart/AAPL?interval=5m&range=1d');
        const json = await res.json();
        
        if (json.chart && json.chart.result) {
          const result = json.chart.result[0];
          const quotes = result.indicators.quote[0];
          const timestamps = result.timestamp;
          
          const formattedData = timestamps.map((t: number, i: number) => {
            const date = new Date(t * 1000);
            return {
              time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
              price: quotes.close[i]
            };
          }).filter((d: any) => d.price !== null);
          
          setChartData(formattedData);
          
          const currentPrice = result.meta.regularMarketPrice;
          const previousClose = result.meta.chartPreviousClose;
          const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
          
          setMeta({
            price: currentPrice,
            change: changePercent,
            symbol: result.meta.symbol,
            name: "Apple Inc."
          });
        }
      } catch (err) {
        console.error("Chart fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChart();
    const interval = setInterval(fetchChart, 30000);
    return () => clearInterval(interval);
  }, []);

  const isPositive = meta.change >= 0;
  const strokeColor = isPositive ? "#22c55e" : "#ef4444";

  return (
    <div className="w-full h-full min-h-[150px] flex flex-col justify-end mt-4">
      {loading ? (
        <div className="flex-1 w-full h-full flex flex-col justify-between animate-pulse">
           <div className="flex justify-between items-baseline mb-2 px-2">
             <div>
               <div className="h-6 w-16 bg-neutral-800 rounded mb-2" />
               <div className="h-4 w-24 bg-neutral-800 rounded" />
             </div>
             <div className="flex flex-col items-end">
               <div className="h-6 w-20 bg-neutral-800 rounded mb-2" />
               <div className="h-4 w-12 bg-neutral-800 rounded" />
             </div>
           </div>
           <div className="flex-1 w-full bg-neutral-800/50 rounded-lg mt-4" />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.8 }}
          className="flex-1 flex flex-col w-full h-full"
        >
          <div className="flex justify-between items-baseline mb-4 px-2">
            <div className="cursor-pointer group" onClick={onNavigate}>
              <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                {meta.symbol}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </h3>
              <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">{meta.name} - View Analysis</p>
            </div>
            <div className="text-right">
              <motion.h3 
                key={meta.price}
                initial={{ y: -5 }} animate={{ y: 0 }}
                className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-danger'}`}
              >
                {getCurrencySymbol()}{meta.price.toFixed(2)}
              </motion.h3>
              <p className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
                {isPositive ? '+' : ''}{meta.change.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="flex-1 w-full h-full min-h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ backgroundColor: "#13131a", borderColor: "#2e2e3e", borderRadius: "8px" }}
                  itemStyle={{ color: strokeColor }}
                  labelStyle={{ color: "#a3a3a3", marginBottom: "4px" }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={strokeColor}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
};
