import { useEffect, useRef, memo } from 'react';
import { Target, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

export const TradingViewFinancials = memo(({ symbol, theme = 'dark' }: { symbol: string, theme?: 'dark' | 'light' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous widget
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
    script.type = 'text/javascript';
    script.async = true;

    // Ensure the symbol format is correct for TradingView (usually NASDAQ:AAPL or NYSE:TSLA, but AAPL works as fallback)
    const tvSymbol = symbol.includes(':') ? symbol : `NASDAQ:${symbol}`;

    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      isTransparent: true,
      largeChartUrl: "",
      displayMode: "regular",
      width: "100%",
      height: "100%",
      symbol: tvSymbol,
      locale: "en"
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme]);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden h-[600px] w-full">
      {/* Header matching the old widget's style to keep the user happy */}
      <div className="p-4 md:p-6 border-b border-border bg-card-hover flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <Target size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Real Financials & Forecasts</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <span className="font-bold">{symbol}</span> &bull; 
              <span className="text-primary font-medium flex items-center gap-1"><TrendingUp size={14} /> Institutional Data via TradingView</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <div className="tradingview-widget-container" style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }}>
          <div className="tradingview-widget-container__widget" ref={containerRef} style={{ height: "100%", width: "100%" }}></div>
        </div>
      </div>
    </div>
  );
});
TradingViewFinancials.displayName = 'TradingViewFinancials';
