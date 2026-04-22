import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type CurrencyType = 'USD' | 'EUR' | 'GBP';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bank: string;
  wallet: string;
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
  name: "Alex Quant",
  email: "alex@quanttrd.io",
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

import { supabase } from '../lib/supabase';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      loadUserData(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      loadUserData(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = (currentSession: any) => {
    if (currentSession?.user?.user_metadata) {
      const meta = currentSession.user.user_metadata;
      if (meta.profile) setProfile(meta.profile);
      if (meta.settings) setSettings(meta.settings);
    } else {
      // Fallback to local storage if not logged in just in case
      const localProfile = localStorage.getItem('quanttrd_profile');
      const localSettings = localStorage.getItem('quanttrd_settings');
      if (localProfile) try { setProfile(JSON.parse(localProfile)); } catch(e){}
      if (localSettings) try { setSettings(JSON.parse(localSettings)); } catch(e){}
    }
  };

  const syncToSupabase = async (newProfile: UserProfile, newSettings: UserSettings) => {
    if (session?.user) {
      await supabase.auth.updateUser({
        data: { profile: newProfile, settings: newSettings }
      });
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...data };
    setProfile(newProfile);
    localStorage.setItem('quanttrd_profile', JSON.stringify(newProfile));
    await syncToSupabase(newProfile, settings);
  };

  const updateSettings = async (data: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...data };
    setSettings(newSettings);
    localStorage.setItem('quanttrd_settings', JSON.stringify(newSettings));
    await syncToSupabase(profile, newSettings);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getCurrencySymbol = () => {
    switch (settings.currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'USD': default: return '$';
    }
  };

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
