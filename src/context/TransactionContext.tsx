import { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';

export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'BUY' | 'SELL';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // positive for deposit/sell, negative for withdraw/buy (cash impact)
  asset: string; // 'USD', 'AAPL', etc.
  shares?: number; // if BUY/SELL
  price?: number; // if BUY/SELL
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface PortfolioPosition {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number; // Mocked for now
}

export interface TransactionContextType {
  transactions: Transaction[];
  cashBalance: number;
  portfolioValue: number;
  totalBalance: number;
  positions: PortfolioPosition[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'date' | 'status'>) => void;
  mockCurrentPrices: Record<string, number>;
}

const MOCK_PRICES: Record<string, number> = {
  'AAPL': 175.50,
  'TSLA': 180.20,
  'MSFT': 410.00,
  'NVDA': 850.10,
  'BTC-USD': 65000.00
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', type: 'DEPOSIT', amount: 50000, asset: 'USD', date: new Date(Date.now() - 86400000 * 30).toISOString(), status: 'COMPLETED' },
  { id: 'tx-2', type: 'BUY', amount: -17550, asset: 'AAPL', shares: 100, price: 175.50, date: new Date(Date.now() - 86400000 * 15).toISOString(), status: 'COMPLETED' },
  { id: 'tx-3', type: 'BUY', amount: -41000, asset: 'MSFT', shares: 100, price: 410.00, date: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'COMPLETED' },
];

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Calculate Cash Balance
  const cashBalance = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.status === 'COMPLETED') {
        return acc + tx.amount;
      }
      return acc;
    }, 0);
  }, [transactions]);

  // Calculate Positions
  const positions = useMemo(() => {
    const posMap = new Map<string, { shares: number; totalCost: number }>();
    
    transactions.forEach(tx => {
      if (tx.status !== 'COMPLETED' || (tx.type !== 'BUY' && tx.type !== 'SELL')) return;
      if (!tx.shares || !tx.price) return;

      const current = posMap.get(tx.asset) || { shares: 0, totalCost: 0 };
      if (tx.type === 'BUY') {
        current.shares += tx.shares;
        current.totalCost += tx.shares * tx.price;
      } else if (tx.type === 'SELL') {
        current.shares -= tx.shares;
        // Simplified average cost reduction
        current.totalCost -= tx.shares * (current.totalCost / (current.shares + tx.shares));
      }
      posMap.set(tx.asset, current);
    });

    const result: PortfolioPosition[] = [];
    posMap.forEach((val, symbol) => {
      if (val.shares > 0) {
        result.push({
          symbol,
          shares: val.shares,
          avgPrice: val.totalCost / val.shares,
          currentPrice: MOCK_PRICES[symbol] || val.totalCost / val.shares
        });
      }
    });
    return result;
  }, [transactions]);

  // Calculate Portfolio Value
  const portfolioValue = useMemo(() => {
    return positions.reduce((acc, pos) => acc + (pos.shares * pos.currentPrice), 0);
  }, [positions]);

  const totalBalance = cashBalance + portfolioValue;

  const addTransaction = (tx: Omit<Transaction, 'id' | 'date' | 'status'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      status: 'COMPLETED'
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      cashBalance,
      portfolioValue,
      totalBalance,
      positions,
      addTransaction,
      mockCurrentPrices: MOCK_PRICES
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
