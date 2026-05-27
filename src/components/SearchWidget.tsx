import { useState, useEffect } from "react";
import { Search, Plus, Check } from "lucide-react";
import { useUser } from "../context/UserContext";
import { apiFetch } from "../lib/api";

const LOCAL_TICKERS = [
  "AAPL", "ABBV", "ABT", "ACN", "ADBE", "AMD", "AMZN", "AVGO", "BAC", "BRK-B", 
  "CMCSA", "COST", "CRM", "CSCO", "CVX", "DIS", "GOOG", "GOOGL", "HD", "HON", 
  "INTC", "JNJ", "JPM", "KO", "LIN", "LLY", "MA", "MCD", "META", "MRK", 
  "MSFT", "NEE", "NFLX", "NKE", "NVDA", "ORCL", "PEP", "PFE", "PG", "PM", 
  "QCOM", "T", "TMO", "TSLA", "TXN", "UNH", "UPS", "V", "VZ", "WFC", "WMT", "XOM"
].sort();

// O(log n) Binary Search for ultra-fast autocomplete
const binarySearchPrefix = (arr: string[], target: string) => {
  let left = 0;
  let right = arr.length - 1;
  const upperTarget = target.toUpperCase();
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midVal = arr[mid];
    
    if (midVal.startsWith(upperTarget)) {
      const matches = [];
      let i = mid;
      while (i >= 0 && arr[i].startsWith(upperTarget)) {
        matches.unshift(arr[i]);
        i--;
      }
      let j = mid + 1;
      while (j < arr.length && arr[j].startsWith(upperTarget)) {
        matches.push(arr[j]);
        j++;
      }
      return matches;
    }
    
    if (midVal < upperTarget) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return [];
};

export const SearchWidget = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addedSymbols, setAddedSymbols] = useState<Set<string>>(new Set());
  const { profile, updateProfile } = useUser();

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        setSearching(false);
        return;
      }
      // 1. Instant local binary search (O(log n))
      const localMatches = binarySearchPrefix(LOCAL_TICKERS, query);
      const localResults = localMatches.map(sym => ({
        symbol: sym,
        shortname: 'O(log n) Local Cache',
        quoteType: 'EQUITY',
        isLocal: true
      }));
      
      // Show immediately for zero latency
      if (localResults.length > 0) {
        setResults(localResults);
      }

      setSearching(true);
      // 2. Fetch full results from API
      try {
        const res = await fetch(`/api/finance/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5`);
        const json = await res.json();
        if (json.quotes) {
          const merged = [...localResults];
          json.quotes.forEach((apiItem: any) => {
            if (!merged.find(m => m.symbol === apiItem.symbol)) {
              merged.push(apiItem);
            }
          });
          setResults(merged.slice(0, 6)); // keep top 6
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setSearching(false);
      }
    };
    
    const timeoutId = setTimeout(search, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleAdd = async (symbol: string) => {
    const watchlist = profile.watchlist || [];
    if (!watchlist.includes(symbol)) {
      setAddedSymbols(prev => new Set(prev).add(symbol));
      
      // Optimistic UI Update
      await updateProfile({ watchlist: [...watchlist, symbol] });
      
      try {
        await apiFetch('/watchlist.php', {
          method: 'POST',
          body: { symbol }
        });
      } catch (error) {
        console.warn("Failed to sync new symbol to PHP API. It is only saved locally.", error);
      }
    }
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
  };

  return (
    <div className="w-full h-full flex flex-col justify-start gap-4 py-4 relative">
      <h2 className="text-2xl font-bold text-foreground mb-2">Find Opportunities</h2>
      <div className="relative group z-20">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
          {searching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          ) : (
            <Search size={20} />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-card-hover border border-border text-foreground text-sm rounded-xl focus:ring-primary focus:border-primary block w-full pl-10 p-3 transition-all outline-none placeholder-neutral-500 hover:border-border/80"
          placeholder="Search stocks, ETFs, crypto..."
        />
        
        {results.length > 0 && query.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card-hover border border-border rounded-xl overflow-hidden shadow-xl z-50">
            {results.map((item, idx) => (
              <div key={`${item.symbol}-${idx}`} className="flex items-center justify-between p-3 hover:bg-neutral-800/50 border-b border-border last:border-0 transition-colors">
                <div className="flex flex-col">
                  <span className="text-foreground font-bold">{item.symbol}</span>
                  <span className={`text-xs truncate max-w-[200px] ${item.isLocal ? 'text-success font-semibold' : 'text-muted-foreground'}`}>{item.shortname || item.longname}</span>
                </div>
                <div className="flex items-center gap-3">
                  {item.isLocal && <span className="text-[10px] bg-success/20 text-success px-2 py-1 rounded-full animate-pulse border border-success/30">Binary Search</span>}
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-neutral-800 rounded text-muted-foreground">{item.quoteType}</span>
                  <button 
                    onClick={() => handleAdd(item.symbol)}
                    disabled={(profile.watchlist || []).includes(item.symbol) || addedSymbols.has(item.symbol)}
                    className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:bg-neutral-800 disabled:text-muted-foreground disabled:hover:bg-neutral-800"
                  >
                    {(profile.watchlist || []).includes(item.symbol) || addedSymbols.has(item.symbol) ? (
                      <Check size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        {["TSLA", "NVDA", "BTC-USD", "SPY"].map((tag) => (
          <span 
            key={tag} 
            onClick={() => handleTagClick(tag)}
            className="px-3 py-1 bg-card-hover text-xs text-muted-foreground rounded-full border border-border cursor-pointer hover:bg-border transition-colors"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};
