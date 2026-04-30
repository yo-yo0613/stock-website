import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, Bell, Settings, User, Shield, CreditCard, Save, Edit2, Phone, Building, Wallet, CheckCircle2, Lock, Smartphone, Upload } from "lucide-react";
import { useUser } from "../context/UserContext";
import type { CurrencyType } from "../context/UserContext";
import { TechnicalAnalysis } from "react-ts-tradingview-widgets";

import { MarketOverview, StockHeatmap } from "react-ts-tradingview-widgets";

export const MarketsView = ({ }: { onNavigate?: (symbol: string) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 shadow-sm min-h-[500px] h-[60vh] flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4 px-2">Global Market Overview</h2>
          <div className="flex-1 rounded-xl overflow-hidden border border-border/50">
            <MarketOverview colorTheme="dark" width="100%" height="100%" showFloatingTooltip />
          </div>
        </div>

        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-4 shadow-sm min-h-[500px] h-[60vh] flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4 px-2">S&P 500 Heatmap</h2>
          <div className="flex-1 rounded-xl overflow-hidden border border-border/50">
            <StockHeatmap colorTheme="dark" width="100%" height="100%" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm min-h-[400px] flex flex-col">
        <div className="flex items-center gap-3 text-success mb-4 px-2">
          <BarChart2 />
          <h2 className="text-xl font-bold text-white">Market Sentiment & Technicals</h2>
        </div>
        <div className="w-full h-[400px] rounded-xl overflow-hidden border border-border/50">
          <TechnicalAnalysis colorTheme="dark" symbol="SPY" width="100%" height="100%" isTransparent={false} />
        </div>
      </div>
    </motion.div>
  );
};

export const AlertsView = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto flex flex-col gap-6"
    >
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
          <div className="flex items-center gap-3 text-warning">
            <Bell className="text-yellow-500" />
            <h2 className="text-xl font-bold text-white">Recent Alerts</h2>
          </div>
          <button className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary/30 transition-colors">Clear All</button>
        </div>

        <div className="space-y-3">
          {[
            { title: "Price Target Reached", msg: "AAPL exceeded $160.00 parameter.", time: "10m ago", color: "text-success" },
            { title: "Volume Spike", msg: "Unusual volume detected in TSLA (+400%).", time: "1h ago", color: "text-primary" },
            { title: "Margin Call Warning", msg: "Account equity dropping near maintenance limit.", time: "2h ago", color: "text-danger text-red-500" },
          ].map((alert, i) => (
            <div key={i} className="flex items-start justify-between p-4 rounded-xl bg-[#13131a] hover:bg-[#1a1a24] transition-colors border border-transparent hover:border-border cursor-pointer">
              <div>
                <h4 className={`font-semibold ${alert.color || "text-white"}`}>{alert.title}</h4>
                <p className="text-sm text-neutral-400 mt-1">{alert.msg}</p>
              </div>
              <span className="text-xs text-neutral-500">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const SettingsView = () => {
  const { settings, updateSettings } = useUser();
  const [activeTab, setActiveTab] = useState("General");
  const [currency, setCurrency] = useState<CurrencyType>(settings.currency);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    updateSettings({ currency });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const tabs = [
    { icon: <Settings size={18} />, label: "General" },
    { icon: <Shield size={18} />, label: "Security" },
    { icon: <CreditCard size={18} />, label: "Billing" },
    { icon: <Bell size={18} />, label: "Notifications" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl mx-auto relative">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 right-0 bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50"
          >
            <CheckCircle2 size={20} />
            <span className="font-medium">Preferences Saved Successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 border-r border-border min-h-[50vh] pr-4 space-y-2">
          {tabs.map((item, i) => {
            const isActive = activeTab === item.label;
            return (
              <div
                key={i}
                onClick={() => setActiveTab(item.label)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isActive ? 'bg-primary/10 text-primary font-medium border border-primary/20' : 'text-neutral-400 hover:text-white hover:bg-[#1a1a24] border border-transparent'}`}
              >
                {item.icon} {item.label}
              </div>
            );
          })}
        </div>
        <div className="col-span-1 md:col-span-3 pl-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{activeTab} Settings</h2>
            {activeTab !== 'General' && (
              <button onClick={handleSave} className="bg-primary hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                <Save size={16} /> Save
              </button>
            )}
          </div>

          {activeTab === "General" ? (
            <div className="space-y-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Theme Preference (Coming Soon)</label>
                <select disabled className="w-full bg-[#13131a] border border-border rounded-lg p-3 text-neutral-500 opacity-70 cursor-not-allowed">
                  <option>Dark Mode (Default)</option>
                  <option>Light Mode</option>
                  <option>System Default</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                  className="w-full bg-[#13131a] border border-border rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <button
                onClick={handleSave}
                className="bg-primary hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors mt-4 flex items-center gap-2"
              >
                <Save size={18} /> Save Preferences
              </button>
            </div>
          ) : activeTab === "Security" ? (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-[#1a1a24] border border-border p-5 rounded-xl space-y-4">
                <h3 className="text-white font-medium flex items-center gap-2"><Lock size={18} className="text-primary" /> Password</h3>
                <div className="grid gap-4">
                  <input type="password" placeholder="Current Password" className="w-full bg-[#13131a] border border-border rounded-lg p-3 text-white focus:outline-none focus:border-primary" />
                  <input type="password" placeholder="New Password" className="w-full bg-[#13131a] border border-border rounded-lg p-3 text-white focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="bg-[#1a1a24] border border-border p-5 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium flex items-center gap-2 mb-1"><Smartphone size={18} className="text-success" /> Two-Factor Authentication (2FA)</h3>
                  <p className="text-sm text-neutral-400">Add an extra layer of security to your account.</p>
                </div>
                <div onClick={() => updateSettings({ security: { ...settings.security, twoFactor: !settings.security.twoFactor } })}
                  className={`w-12 h-6 rounded-full cursor-pointer relative transition-colors ${settings.security.twoFactor ? 'bg-success' : 'bg-neutral-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings.security.twoFactor ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
            </div>
          ) : activeTab === "Billing" ? (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/50 relative overflow-hidden p-6 rounded-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard size={100} /></div>
                <h3 className="text-2xl font-bold text-white mb-1">{settings.billing.plan}</h3>
                <p className="text-neutral-300 font-medium mb-6">Active Subscription</p>
                <p className="text-sm text-neutral-400">Next billing date: <strong>{settings.billing.nextBilling}</strong></p>
              </div>
              <div className="bg-[#1a1a24] border border-border p-5 rounded-xl">
                <h3 className="text-white font-medium mb-4">Payment Method</h3>
                <div className="flex items-center gap-4 bg-[#13131a] p-4 rounded-lg border border-border">
                  <div className="w-12 h-8 bg-neutral-800 rounded flex items-center justify-center font-bold text-white tracking-widest text-xs italic">VISA</div>
                  <div>
                    <p className="text-white font-medium">Visa ending in {settings.billing.cardLast4}</p>
                    <p className="text-xs text-neutral-500">Expires 12/28</p>
                  </div>
                  <button className="ml-auto text-sm text-primary hover:text-blue-400 font-medium">Update</button>
                </div>
              </div>
            </div>
          ) : activeTab === "Notifications" ? (
            <div className="space-y-4 max-w-2xl">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="bg-[#1a1a24] border border-border p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium capitalize">{key} Notifications</h3>
                    <p className="text-sm text-neutral-400">Receive alerts via {key}.</p>
                  </div>
                  <div onClick={() => updateSettings({ notifications: { ...settings.notifications, [key]: !value } })}
                    className={`w-12 h-6 rounded-full cursor-pointer relative transition-colors ${value ? 'bg-primary' : 'bg-neutral-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${value ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export const ProfileView = () => {
  const { profile, updateProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let { width, height } = img;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setFormData({ ...formData, avatarUrl: canvas.toDataURL('image/jpeg', 0.8) });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto flex flex-col gap-6"
    >
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center relative">
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditing ? 'bg-success text-white hover:bg-green-600' : 'bg-[#1a1a24] text-neutral-300 hover:bg-[#2e2e3e] hover:text-white'}`}
        >
          {isEditing ? <><Save size={16} /> Save Profile</> : <><Edit2 size={16} /> Edit Profile</>}
        </button>

        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />

        <div
          onClick={() => isEditing && fileInputRef.current?.click()}
          className={`w-24 h-24 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center text-4xl font-bold text-primary mb-4 relative overflow-hidden ${isEditing ? 'cursor-pointer group' : ''}`}
        >
          {isEditing && (
            <div className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Upload size={20} />
              <span className="text-xs mt-1">Upload</span>
            </div>
          )}
          {formData.avatarUrl ? (
            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : profile.name ? (
            profile.name.charAt(0).toUpperCase()
          ) : (
            <User size={48} />
          )}
        </div>

        {isEditing ? (
          <div className="w-full max-w-sm space-y-4 text-left mt-2">
            <div>
              <label className="text-xs text-neutral-500 uppercase font-semibold">Display Name</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#13131a] border border-border rounded-lg p-2 text-white focus:border-primary outline-none mt-1" />
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
            <p className="text-neutral-400 mt-1 mb-6">Pro Trader Tier &bull; Member since 2024</p>
          </>
        )}

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 border-t border-border/50 pt-8 text-left">

          <div className="bg-[#1a1a24] p-5 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 mb-2 text-neutral-400"><User size={16} /> <span className="text-sm font-semibold uppercase tracking-wider">Email Address</span></div>
            {isEditing ? (
              <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#13131a] border border-border rounded p-2 text-white font-medium outline-none" />
            ) : <p className="font-medium text-white truncate">{profile.email}</p>}
          </div>

          <div className="bg-[#1a1a24] p-5 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 mb-2 text-neutral-400"><Phone size={16} /> <span className="text-sm font-semibold uppercase tracking-wider">Phone Number</span></div>
            {isEditing ? (
              <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-[#13131a] border border-border rounded p-2 text-white font-medium outline-none" placeholder="+1 (555) 000-0000" />
            ) : <p className="font-medium text-white">{profile.phone || "Not provided"}</p>}
          </div>

          <div className="bg-[#1a1a24] p-5 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 mb-2 text-neutral-400"><Building size={16} /> <span className="text-sm font-semibold uppercase tracking-wider">Bank Details</span></div>
            {isEditing ? (
              <input value={formData.bank} onChange={e => setFormData({ ...formData, bank: e.target.value })} className="w-full bg-[#13131a] border border-border rounded p-2 text-white font-medium outline-none" placeholder="Bank Name / Account" />
            ) : <p className="font-medium text-white truncate">{profile.bank || "Not provided"}</p>}
          </div>

          <div className="bg-[#1a1a24] p-5 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 mb-2 text-neutral-400"><Wallet size={16} /> <span className="text-sm font-semibold uppercase tracking-wider">Crypto Wallet</span></div>
            {isEditing ? (
              <input value={formData.wallet} onChange={e => setFormData({ ...formData, wallet: e.target.value })} className="w-full bg-[#13131a] border border-border rounded p-2 text-white font-medium outline-none" placeholder="0x..." />
            ) : <p className="font-medium text-white truncate font-mono text-sm">{profile.wallet || "Not provided"}</p>}
          </div>

        </div>
      </div>
    </motion.div>
  );
};

import { AdvancedRealTimeChart, CompanyProfile, SymbolInfo, FundamentalData } from "react-ts-tradingview-widgets";

export const AnalysisView = ({ symbol }: { symbol: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-6"
    >
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm min-h-[600px] h-[70vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-bold text-white">Advanced Technical Analysis</h2>
          <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">Powered by TradingView</span>
        </div>
        <div className="flex-1 w-full h-full rounded-xl overflow-hidden border border-border/50">
          <AdvancedRealTimeChart
            symbol={`NASDAQ:${symbol}`}
            theme="dark"
            autosize
            allow_symbol_change={false}
            hide_side_toolbar={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm overflow-hidden h-[450px] flex flex-col lg:col-span-1">
          <h2 className="text-lg font-bold text-white mb-4 px-2">Company Profile</h2>
          <div className="flex-1 rounded-xl overflow-hidden border border-border/50">
            <CompanyProfile symbol={`NASDAQ:${symbol}`} colorTheme="dark" height="100%" width="100%" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm overflow-hidden h-[450px] flex flex-col lg:col-span-1">
          <h2 className="text-lg font-bold text-white mb-4 px-2">Symbol Info</h2>
          <div className="flex-1 rounded-xl overflow-hidden border border-border/50">
            <SymbolInfo symbol={`NASDAQ:${symbol}`} colorTheme="dark" autosize />
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm overflow-hidden h-[450px] flex flex-col lg:col-span-1">
          <h2 className="text-lg font-bold text-white mb-4 px-2">Fundamental Data</h2>
          <div className="flex-1 rounded-xl overflow-hidden border border-border/50">
            <FundamentalData symbol={`NASDAQ:${symbol}`} colorTheme="dark" width="100%" height="100%" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const NewsView = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // In-App Reader State
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [articleHtml, setArticleHtml] = useState<string>("");
  const [articleLoading, setArticleLoading] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/finance/v1/finance/search?q=market&newsCount=30');
        const data = await res.json();
        if (data && data.news) {
          setNews(data.news);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const totalPages = Math.ceil(news.length / pageSize) || 1;
  const currentNews = news.slice((page - 1) * pageSize, page * pageSize);

  const formatTime = (ts: number) => {
    return new Date(ts * 1000).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' });
  };

  const openArticle = async (item: any) => {
    setSelectedArticle(item);
    setArticleLoading(true);
    setArticleHtml("");
    try {
      // Use the PHP proxy to bypass CORS and extract the article body
      const API_BASE = import.meta.env.VITE_PHP_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${API_BASE}/news_proxy.php?url=${encodeURIComponent(item.link)}`);
      const data = await res.json();
      if (data.success) {
        setArticleHtml(data.content);
      } else {
        setArticleHtml(`<p class="text-danger">Failed to load article: ${data.error || 'Unknown error'}</p>`);
      }
    } catch (e) {
      console.error(e);
      setArticleHtml('<p class="text-danger">Network error while fetching article.</p>');
    } finally {
      setArticleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-6"
    >
      <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm min-h-[600px] flex flex-col">
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Global Financial News</h2>
            <p className="text-neutral-400 text-sm mt-1">Live market reporting and analysis</p>
          </div>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">Live API</span>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-neutral-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p>Scanning global publishers...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            {currentNews.map((item, idx) => (
              <div
                key={item.uuid || idx}
                onClick={() => openArticle(item)}
                className="group flex flex-col sm:flex-row gap-5 p-4 rounded-xl hover:bg-[#1a1a24] border border-transparent hover:border-border transition-all outline-none cursor-pointer"
              >
                {item.thumbnail?.resolutions?.[0]?.url && (
                  <div className="w-full sm:w-40 h-48 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-neutral-900 shadow-md">
                    <img src={item.thumbnail.resolutions[0].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                  </div>
                )}
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-neutral-400 capitalize bg-neutral-800 px-2 py-0.5 rounded">{item.publisher}</p>
                      <span className="text-xs text-neutral-500">{formatTime(item.providerPublishTime)}</span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-white mb-2 leading-snug group-hover:text-primary transition-colors">{item.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {item.relatedTickers?.slice(0, 4).map((t: string) => (
                      <span key={t} className="text-[10px] font-bold px-2 py-1 rounded bg-primary/15 text-primary tracking-wider">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && news.length > 0 && (
          <div className="pt-8 mt-auto border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-neutral-500 font-medium">Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, news.length)} of {news.length} results</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 text-neutral-400 mr-2 border border-border"
              >
                Prev
              </button>
              <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`min-w-[36px] h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${page === i + 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white border border-transparent hover:border-border'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 text-neutral-400 ml-2 border border-border"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* In-App Article Reader Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-3xl h-full bg-card border-l border-border shadow-2xl overflow-y-auto flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-card/90 backdrop-blur border-b border-border p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedArticle(null)} className="text-neutral-400 hover:text-white transition-colors bg-[#1a1a24] p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <span className="text-sm font-semibold text-neutral-400 capitalize">{selectedArticle.publisher}</span>
                </div>
                <a href={selectedArticle.link} target="_blank" rel="noreferrer" className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded hover:bg-primary/30 transition-colors flex items-center gap-1">
                  Open Original <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>

              <div className="p-6 md:p-10 flex-1">
                <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-4">{selectedArticle.title}</h1>
                <div className="flex items-center gap-4 text-sm text-neutral-400 mb-8 border-b border-border/50 pb-6">
                  <span>{formatTime(selectedArticle.providerPublishTime)}</span>
                  {selectedArticle.relatedTickers?.length > 0 && (
                    <div className="flex gap-2">
                      {selectedArticle.relatedTickers.slice(0, 3).map((t: string) => (
                        <span key={t} className="bg-primary/10 text-primary px-2 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {articleLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-neutral-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p>Extracting article content...</p>
                  </div>
                ) : (
                  <div
                    className="prose prose-invert prose-lg max-w-none text-neutral-300 leading-relaxed
                               prose-a:text-primary hover:prose-a:text-blue-400
                               prose-headings:text-white prose-headings:font-bold
                               prose-img:rounded-xl prose-img:shadow-lg"
                    dangerouslySetInnerHTML={{ __html: articleHtml }}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
