import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type CurrencyType = 'USD' | 'EUR' | 'GBP';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bank: string;
  wallet: string;
  bio?: string;
  avatarUrl?: string; // Stored as base64 data URI
  stats: {
    balance: number;
    profit: number;
    positions: number;
  };
  watchlist: string[];
}

export interface UserSettings {
  currency: CurrencyType;
  theme: 'dark' | 'light';
  security: {
    twoFactor: boolean;
  };
  billing: {
    plan: string;
    nextBilling: string;
    cardLast4: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  }
}

export interface UserContextType {
  profile: UserProfile;
  settings: UserSettings;
  session: any;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  getCurrencySymbol: () => string;
  signOut: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  name: "",
  email: "guest@quanttrd.io",
  phone: "+1 (555) 123-4567",
  bank: "JPMorgan Chase",
  wallet: "0x7a...9d8E",
  stats: {
    balance: 124562.00,
    profit: 12.5,
    positions: 14
  },
  watchlist: ["AAPL", "TSLA", "MSFT", "NVDA", "BTC-USD"]
};

const defaultSettings: UserSettings = {
  currency: 'USD',
  theme: 'dark',
  security: { twoFactor: true },
  billing: { plan: "Pro Tier", nextBilling: "May 1, 2026", cardLast4: "4242" },
  notifications: { email: true, sms: false, push: true }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

import { apiFetch, getAuthToken, removeAuthToken } from '../lib/api';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      loadUserDataFromPHP();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserDataFromPHP = async () => {
    try {
      const data = await apiFetch('/api/profile');
      if (data && data.email) {
        setSession({ user: { email: data.email, id: data.id } });
        setProfile(prev => ({
          ...prev,
          email: data.email,
          name: data.name || "",
          bio: data.bio || "",
          stats: { ...prev.stats, balance: data.balance },
          watchlist: data.watchlist || []
        }));
      }
    } catch (err) {
      console.error("Failed to load user profile from PHP", err);
      removeAuthToken();
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...data };
    setProfile(newProfile);
    
    // Update balance on the PHP backend if it changed
    if (data.stats?.balance !== undefined) {
      try {
        await apiFetch('/api/profile', {
          method: 'POST',
          body: { balance: data.stats.balance }
        });
      } catch (err) {
        console.error("Failed to update balance via API", err);
      }
    }
  };

  const updateSettings = async (data: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...data };
    setSettings(newSettings);
    // Not implemented in PHP backend yet
  };

  const signOut = async () => {
    removeAuthToken();
    setSession(null);
  };

  const getCurrencySymbol = () => {
    switch (settings.currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'USD': default: return '$';
    }
  };

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  return (
    <UserContext.Provider value={{ profile, settings, session, loading, updateProfile, updateSettings, getCurrencySymbol, signOut }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
