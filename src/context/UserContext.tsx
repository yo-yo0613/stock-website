import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  apiFetch,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isDemoModeActive,
  enableDemoModeStorage,
  disableDemoModeStorage,
} from '../lib/api';

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
  };
}

export interface UserContextType {
  profile: UserProfile;
  settings: UserSettings;
  session: any;
  isDemo: boolean;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  getCurrencySymbol: () => string;
  enterDemoMode: () => void;
  completeAuthSession: (token: string, user: { id: number; email: string }, serverProfile?: any) => void;
  signOut: () => Promise<void>;
}

const DEMO_PROFILE_STORAGE_KEY = 'quanttrd_demo_profile';

const defaultProfile: UserProfile = {
  name: 'Demo Quant Trader',
  email: 'guest@quanttrd.io',
  phone: '+1 (555) 123-4567',
  bank: 'JPMorgan Chase',
  wallet: '0x7a...9d8E',
  bio: 'Exploring QuantTrd live multi-market analytics & backtesting.',
  stats: {
    balance: 124562.0,
    profit: 12.5,
    positions: 14,
  },
  watchlist: ['NVDA', 'TSLA', 'AAPL', '2330.TW', 'BTC-USD'],
};

const defaultSettings: UserSettings = {
  currency: 'USD',
  theme: 'dark',
  security: { twoFactor: true },
  billing: { plan: 'Pro Tier', nextBilling: 'Dec 1, 2026', cardLast4: '4242' },
  notifications: { email: true, sms: false, push: true },
};

const loadSavedDemoProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(DEMO_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultProfile, ...parsed };
    }
  } catch {
    // Ignore malformed local cache
  }
  return defaultProfile;
};

// Synchronously detect ?demo=1 in URL so HR / interviewers see the dashboard in 0.00ms without a spinner
const detectInitialDemoEntry = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === '1') {
    enableDemoModeStorage();
    params.delete('demo');
    const cleanQuery = params.toString();
    const cleanUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', cleanUrl);
    return true;
  }
  return !getAuthToken() && isDemoModeActive();
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const initialDemo = detectInitialDemoEntry();

  const [profile, setProfile] = useState<UserProfile>(() =>
    initialDemo ? loadSavedDemoProfile() : defaultProfile
  );
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isDemo, setIsDemo] = useState<boolean>(initialDemo);
  const [session, setSession] = useState<any>(() =>
    initialDemo ? { user: { id: 0, email: defaultProfile.email }, isDemo: true } : null
  );
  const [loading, setLoading] = useState<boolean>(() => Boolean(getAuthToken()) && !initialDemo);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      loadUserDataFromServer();
    } else if (!initialDemo) {
      setLoading(false);
    }
  }, []);

  const loadUserDataFromServer = async () => {
    try {
      const data = await apiFetch('/profile');
      if (data && data.email) {
        disableDemoModeStorage();
        setIsDemo(false);
        setSession({ user: { email: data.email, id: data.id }, isDemo: false });
        setProfile(prev => ({
          ...prev,
          email: data.email,
          name: data.name || data.email.split('@')[0],
          bio: data.bio || '',
          stats: { ...prev.stats, balance: Number(data.balance ?? prev.stats.balance) },
          watchlist: Array.isArray(data.watchlist) && data.watchlist.length > 0 ? data.watchlist : prev.watchlist,
        }));
      }
    } catch (err) {
      console.error('Failed to load user profile from FastAPI', err);
      removeAuthToken();
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const enterDemoMode = () => {
    removeAuthToken();
    enableDemoModeStorage();
    const demoProf = loadSavedDemoProfile();
    setProfile(demoProf);
    setIsDemo(true);
    setSession({ user: { id: 0, email: demoProf.email }, isDemo: true });
    setLoading(false);
  };

  const completeAuthSession = (
    token: string,
    user: { id: number; email: string },
    serverProfile?: any
  ) => {
    disableDemoModeStorage();
    setAuthToken(token);
    setIsDemo(false);
    setSession({ user, isDemo: false });
    if (serverProfile) {
      setProfile(prev => ({
        ...prev,
        email: serverProfile.email || user.email,
        name: serverProfile.name || user.email.split('@')[0],
        bio: serverProfile.bio ?? prev.bio,
        stats: {
          ...prev.stats,
          balance: Number(serverProfile.balance ?? prev.stats.balance),
        },
        watchlist:
          Array.isArray(serverProfile.watchlist) && serverProfile.watchlist.length > 0
            ? serverProfile.watchlist
            : prev.watchlist,
      }));
    } else {
      loadUserDataFromServer();
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...data };
    setProfile(newProfile);

    if (isDemo) {
      try {
        localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
      } catch {
        // Ignore storage quota errors
      }
      return;
    }

    const payload: Record<string, any> = {};
    if (data.stats?.balance !== undefined) payload.balance = data.stats.balance;
    if (data.name !== undefined) payload.name = data.name;
    if (data.bio !== undefined) payload.bio = data.bio;

    if (Object.keys(payload).length > 0) {
      try {
        await apiFetch('/profile', {
          method: 'POST',
          body: payload,
        });
      } catch (err) {
        console.error('Failed to update profile via FastAPI', err);
      }
    }
  };

  const updateSettings = async (data: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...data };
    setSettings(newSettings);
  };

  const signOut = async () => {
    removeAuthToken();
    disableDemoModeStorage();
    setIsDemo(false);
    setSession(null);
  };

  const getCurrencySymbol = () => {
    switch (settings.currency) {
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'USD':
      default:
        return '$';
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
    <UserContext.Provider
      value={{
        profile,
        settings,
        session,
        isDemo,
        loading,
        updateProfile,
        updateSettings,
        getCurrencySymbol,
        enterDemoMode,
        completeAuthSession,
        signOut,
      }}
    >
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
