import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Play, RefreshCw, Maximize2, Minimize2 } from "lucide-react";

type GraphNode = { id: string; x: number; y: number; label: string; depth: number };
type GraphEdge = { source: string; target: string };

export const CorrelationGraph = ({ symbol }: { symbol: string }) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runBFS = async (startSymbol: string) => {
    setRunning(true);
    setHasRun(true);
    const queue = [{ symbol: startSymbol, depth: 0 }];
    const visited = new Set<string>([startSymbol]);
    
    const newNodes: GraphNode[] = [{ id: startSymbol, x: 400, y: 200, label: startSymbol, depth: 0 }];
    const newEdges: GraphEdge[] = [];
    
    setNodes([...newNodes]);
    setEdges([...newEdges]);

    const center = { x: 400, y: 200 };
    const radius = [0, 100, 180]; 
    let depth1Count = 0;
    let depth2Count = 0;

    while (queue.length > 0 && newNodes.length < 20) {
      const current = queue.shift()!;
      if (current.depth >= 2) continue;

      try {
        await new Promise(r => setTimeout(r, 600)); // artificial network delay for visualization
        
        const mockRelations: Record<string, string[]> = {
          'AAPL': ['MSFT', 'TSM', 'QCOM', 'GOOGL', 'TSLA', 'AMZN'],
          'TSM': ['ASML', 'NVDA', 'AMD', 'INTC', 'AAPL', 'AVGO'],
          'NVDA': ['AMD', 'TSM', 'SMCI', 'ARM', 'MSFT'],
          'MSFT': ['GOOGL', 'AMZN', 'META', 'AAPL', 'NVDA'],
          'GOOGL': ['MSFT', 'META', 'AMZN', 'AAPL'],
          'TSLA': ['F', 'GM', 'RIVN', 'AAPL']
        };

        let related = mockRelations[current.symbol];
        if (!related) {
          const res = await fetch(`/api/finance/v1/finance/search?q=${current.symbol}&quotesCount=5`);
          const data = await res.json();
          related = (data.quotes || []).map((q: any) => q.symbol).filter((s: string) => s !== current.symbol).slice(0, 3);
        }

        for (const rel of related) {
          if (!visited.has(rel) && newNodes.length < 20) {
            visited.add(rel);
            queue.push({ symbol: rel, depth: current.depth + 1 });
            
            const d = current.depth + 1;
            const angle = d === 1 
              ? (depth1Count++ * (Math.PI * 2) / (related.length || 6)) 
              : (depth2Count++ * (Math.PI * 2) / 12);
              
            newNodes.push({
              id: rel,
              label: rel,
              depth: d,
              x: center.x + Math.cos(angle) * radius[d] + (Math.random()*30-15),
              y: center.y + Math.sin(angle) * radius[d] + (Math.random()*30-15)
            });
            
            setNodes([...newNodes]);
          }
          
          if (!newEdges.find(e => (e.source === current.symbol && e.target === rel) || (e.target === current.symbol && e.source === rel))) {
             newEdges.push({ source: current.symbol, target: rel });
             setEdges([...newEdges]);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    setRunning(false);
  };

  const containerClasses = isExpanded 
    ? "fixed inset-4 z-[200] bg-card border-2 border-primary/50 shadow-2xl rounded-2xl p-6 flex flex-col overflow-hidden" 
    : "bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[450px] flex flex-col relative overflow-hidden";

  return (
    <>
    {/* Placeholder to prevent layout shift when expanded */}
    {isExpanded && <div className="min-h-[450px] w-full rounded-2xl border border-dashed border-border/50 bg-card-hover/20" />}
    
    <motion.div 
      layout
      className={containerClasses}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 z-10 gap-4">
        <div className="flex items-center gap-3 text-primary">
          <Network className="text-purple-500" />
          <h2 className="text-xl font-bold text-foreground">Market Correlation (BFS)</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => runBFS(symbol)}
            disabled={running}
            className="flex items-center justify-center gap-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white border border-purple-500/30 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {running ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
            {running ? "Crawling..." : hasRun ? "Re-run" : "Start BFS"}
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center p-2 bg-card-hover hover:bg-muted text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
            title={isExpanded ? "Minimize" : "Expand Fullscreen"}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 w-full bg-[#0a0a0f] rounded-xl border border-border/50 relative overflow-hidden flex items-center justify-center">
        {!hasRun && !running ? (
          <div className="text-center text-muted-foreground z-10">
            <Network size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Click Start to initiate Breadth-First Search</p>
            <p className="text-sm mt-1">Maps market correlations starting from {symbol}</p>
          </div>
        ) : null}

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
          {/* Edges */}
          {edges.map((edge, i) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            
            return (
              <motion.line
                key={`edge-${i}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 0.5 }}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#8b5cf6"
                strokeWidth={sourceNode.depth === 0 ? 3 : 1.5}
              />
            );
          })}
          
          {/* Nodes */}
          {nodes.map((node) => (
            <motion.g key={node.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.depth === 0 ? 24 : node.depth === 1 ? 18 : 14}
                fill={node.depth === 0 ? "#8b5cf6" : node.depth === 1 ? "#6d28d9" : "#4c1d95"}
                stroke="#1e1e2e"
                strokeWidth={3}
                className="pointer-events-auto cursor-pointer hover:stroke-white transition-all"
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dy=".3em"
                fill="white"
                fontSize={node.depth === 0 ? 12 : 9}
                fontWeight="bold"
                className="pointer-events-none"
              >
                {node.label}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>
    </motion.div>
    </>
  );
};
