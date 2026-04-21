import { Search } from "lucide-react";

export const SearchWidget = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-4 py-4">
      <h2 className="text-2xl font-bold text-white mb-2">Find Opportunities</h2>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400 group-hover:text-primary transition-colors">
          <Search size={20} />
        </div>
        <input
          type="text"
          className="bg-[#1a1a24] border border-border text-white text-sm rounded-xl focus:ring-primary focus:border-primary block w-full pl-10 p-3 transition-all outline-none placeholder-neutral-500 hover:border-border/80"
          placeholder="Search stocks, ETFs, crypto..."
        />
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        {["TSLA", "NVDA", "BTC", "SPY"].map((tag) => (
          <span key={tag} className="px-3 py-1 bg-[#1a1a24] text-xs text-neutral-300 rounded-full border border-border cursor-pointer hover:bg-border transition-colors">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};
