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
  updateProfile: (data: Partial<UserProfile>) => void;
  updateSettings: (data: Partial<UserSettings>) => void;
  getCurrencySymbol: () => string;
}

const defaultProfile: UserProfile = {
  name: "Alex Quant",
  email: "alex@quanttrd.io",
  phone: "+1 (555) 123-4567",
  bank: "JPMorgan Chase",
  wallet: "0x7a...9d8E"
};

const defaultSettings: UserSettings = {
  currency: 'USD',
  theme: 'dark',
  security: { twoFactor: true },
  billing: { plan: "Pro Tier", nextBilling: "May 1, 2026", cardLast4: "4242" },
  notifications: { email: true, sms: false, push: true }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('quanttrd_profile');
    const savedSettings = localStorage.getItem('quanttrd_settings');

    if (savedProfile) {
      try { setProfile(JSON.parse(savedProfile)); } catch (e) { }
    }
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) { }
    }
    setIsLoaded(true);
  }, []);

  const updateProfile = (data: Partial<UserProfile>) => {
    setProfile(prev => {
      const newProfile = { ...prev, ...data };
      localStorage.setItem('quanttrd_profile', JSON.stringify(newProfile));
      return newProfile;
    });
  };

  const updateSettings = (data: Partial<UserSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...data };
      localStorage.setItem('quanttrd_settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const getCurrencySymbol = () => {
    switch (settings.currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'USD': default: return '$';
    }
  };

  if (!isLoaded) return null; // Prevent hydration mismatch

  return (
    <UserContext.Provider value={{ profile, settings, updateProfile, updateSettings, getCurrencySymbol }}>
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
