import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Database } from "lucide-react";
import { apiFetch } from "../lib/api";

type TreeNodeData = {
  name: string;
  value: number;
  fmt: string;
  children: TreeNodeData[];
};

// Fallback logic for when the PHP backend is unreachable (e.g. static Vercel deployment)
const generateMockTree = (symbol: string): TreeNodeData => {
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseRev = (50000 + (hash % 100) * 5000) * 1000000;
  
  const format = (val: number) => "$" + (val / 1000000000).toFixed(2) + "B";

  return {
    name: `Financial Statements (${new Date().getFullYear()}) - ${symbol}`,
    value: baseRev,
    fmt: "Comprehensive",
    children: [
      {
        name: "Income Statement",
        value: baseRev,
        fmt: format(baseRev),
        children: [
          {
            name: "Total Revenue",
            value: baseRev,
            fmt: format(baseRev),
            children: [
              { name: "Hardware & Devices", value: baseRev * 0.45, fmt: format(baseRev * 0.45), children: [] },
              { name: "Software & Cloud", value: baseRev * 0.35, fmt: format(baseRev * 0.35), children: [] },
              { name: "Services & Subscriptions", value: baseRev * 0.20, fmt: format(baseRev * 0.20), children: [] }
            ]
          },
          {
            name: "Cost of Revenue (COGS)",
            value: baseRev * -0.4,
            fmt: format(baseRev * -0.4),
            children: [
              { name: "Material Costs", value: baseRev * -0.25, fmt: format(baseRev * -0.25), children: [] },
              { name: "Labor & Manufacturing", value: baseRev * -0.15, fmt: format(baseRev * -0.15), children: [] }
            ]
          },
          {
            name: "Operating Expenses",
            value: baseRev * -0.3,
            fmt: format(baseRev * -0.3),
            children: [
              { name: "Research & Development (R&D)", value: baseRev * -0.15, fmt: format(baseRev * -0.15), children: [] },
              { name: "Sales & Marketing (S&M)", value: baseRev * -0.10, fmt: format(baseRev * -0.10), children: [] },
              { name: "General & Admin (G&A)", value: baseRev * -0.05, fmt: format(baseRev * -0.05), children: [] }
            ]
          },
          {
            name: "Net Income",
            value: baseRev * 0.25,
            fmt: format(baseRev * 0.25),
            children: []
          }
        ]
      },
      {
        name: "Balance Sheet",
        value: baseRev * 2.5,
        fmt: format(baseRev * 2.5),
        children: [
          {
            name: "Total Assets",
            value: baseRev * 2.5,
            fmt: format(baseRev * 2.5),
            children: [
              {
                name: "Current Assets",
                value: baseRev * 1.0,
                fmt: format(baseRev * 1.0),
                children: [
                  { name: "Cash & Equivalents", value: baseRev * 0.6, fmt: format(baseRev * 0.6), children: [] },
                  { name: "Short-term Investments", value: baseRev * 0.2, fmt: format(baseRev * 0.2), children: [] },
                  { name: "Inventory", value: baseRev * 0.2, fmt: format(baseRev * 0.2), children: [] }
                ]
              },
              {
                name: "Non-Current Assets",
                value: baseRev * 1.5,
                fmt: format(baseRev * 1.5),
                children: [
                  { name: "Property, Plant & Equipment", value: baseRev * 0.8, fmt: format(baseRev * 0.8), children: [] },
                  { name: "Intangible Assets & Goodwill", value: baseRev * 0.7, fmt: format(baseRev * 0.7), children: [] }
                ]
              }
            ]
          },
          {
            name: "Total Liabilities",
            value: baseRev * 1.2,
            fmt: format(baseRev * 1.2),
            children: [
              {
                name: "Current Liabilities",
                value: baseRev * 0.5,
                fmt: format(baseRev * 0.5),
                children: [
                  { name: "Accounts Payable", value: baseRev * 0.3, fmt: format(baseRev * 0.3), children: [] },
                  { name: "Short-term Debt", value: baseRev * 0.2, fmt: format(baseRev * 0.2), children: [] }
                ]
              },
              {
                name: "Long-term Debt",
                value: baseRev * 0.7,
                fmt: format(baseRev * 0.7),
                children: []
              }
            ]
          },
          {
            name: "Shareholders' Equity",
            value: baseRev * 1.3,
            fmt: format(baseRev * 1.3),
            children: [
              { name: "Retained Earnings", value: baseRev * 1.0, fmt: format(baseRev * 1.0), children: [] },
              { name: "Common Stock", value: baseRev * 0.3, fmt: format(baseRev * 0.3), children: [] }
            ]
          }
        ]
      },
      {
        name: "Cash Flow Statement",
        value: baseRev * 0.3,
        fmt: format(baseRev * 0.3),
        children: [
          { name: "Operating Cash Flow", value: baseRev * 0.4, fmt: format(baseRev * 0.4), children: [] },
          { name: "Investing Cash Flow", value: baseRev * -0.15, fmt: format(baseRev * -0.15), children: [
            { name: "Capital Expenditures (CapEx)", value: baseRev * -0.1, fmt: format(baseRev * -0.1), children: [] },
            { name: "Strategic Acquisitions", value: baseRev * -0.05, fmt: format(baseRev * -0.05), children: [] }
          ] },
          { name: "Financing Cash Flow", value: baseRev * 0.05, fmt: format(baseRev * 0.05), children: [
            { name: "Stock Repurchases", value: baseRev * -0.05, fmt: format(baseRev * -0.05), children: [] },
            { name: "Debt Issuance", value: baseRev * 0.1, fmt: format(baseRev * 0.1), children: [] }
          ] }
        ]
      }
    ]
  };
};

const TreeNode = ({ node, depth = 0 }: { node: TreeNodeData; depth?: number }) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col w-full">
      <div 
        className={`flex items-center justify-between p-2 hover:bg-card-hover rounded-lg cursor-pointer transition-colors ${depth === 0 ? 'bg-primary/10 border border-primary/20' : ''}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            expanded ? <ChevronDown size={16} className="text-primary" /> : <ChevronRight size={16} className="text-muted-foreground" />
          ) : (
            <div className="w-4 h-4" /> // spacer
          )}
          <span className={`text-sm ${depth === 0 ? 'font-bold text-primary' : 'font-medium text-foreground'}`}>
            {node.name}
          </span>
        </div>
        <span className={`text-sm font-mono ${depth === 0 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
          {node.fmt}
        </span>
      </div>
      
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-1 mt-1 border-l-2 border-border/50"
            style={{ marginLeft: `${depth * 20 + 16}px` }}
          >
            {node.children.map((child, idx) => (
              <TreeNode key={idx} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FinancialTreeView = ({ symbol }: { symbol: string }) => {
  const [treeData, setTreeData] = useState<TreeNodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("");

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/financial_scraper.php?symbol=${symbol}`);
        if (res && res.success && res.tree) {
          setTreeData(res.tree);
          setSource(res.source);
        } else {
          throw new Error("No tree in response");
        }
      } catch (e) {
        console.warn("Failed to fetch financial tree from backend, using frontend heuristic fallback", e);
        setTreeData(generateMockTree(symbol));
        setSource("Heuristic Model (Frontend Fallback)");
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, [symbol]);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-3 text-primary">
          <Database className="text-blue-500" />
          <h2 className="text-xl font-bold text-foreground">Deep Financial Tree (DFS)</h2>
        </div>
        {source && (
          <span className="text-[10px] uppercase font-bold tracking-wider bg-card-hover border border-border px-3 py-1.5 rounded-full text-muted-foreground flex items-center justify-center">
            {source}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-sm font-medium animate-pulse">Scraping financial data & building tree...</span>
          </div>
        ) : treeData ? (
          <div className="flex flex-col gap-2 pb-4">
            <TreeNode node={treeData} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground bg-card-hover rounded-xl border border-dashed border-border">
            No financial data available for {symbol}.
          </div>
        )}
      </div>
    </div>
  );
};
