import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BentoGrid, BentoGridItem } from "./components/BentoGrid";
import { StockChart } from "./components/StockChart";
import { Watchlist } from "./components/Watchlist";
import { SearchWidget } from "./components/SearchWidget";
import { PortfolioStats } from "./components/PortfolioStats";
import { MarketsView, AlertsView, SettingsView, ProfileView, AnalysisView, NewsView } from "./components/Views";
import { LineChart, LayoutDashboard, Settings, Bell, User, TrendingUp, Newspaper, Share, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [showQRModal, setShowQRModal] = useState(false);

  const handleNavigateAnalysis = (sym: string) => {
    setSelectedSymbol(sym);
    setActiveTab("Analysis");
  };

  const dashboardItems = [
    {
      title: "Market Performance",
      description: "S&P 500 integrated realtime heatmap and trajectory.",
      header: <StockChart onNavigate={() => handleNavigateAnalysis("AAPL")} />,
      className: "md:col-span-2",
    },
    {
      title: "Your Watchlist",
      description: "Tracked assets and rapid movements.",
      header: <Watchlist onNavigate={handleNavigateAnalysis} />,
      className: "md:col-span-1 md:row-span-2",
    },
    {
      title: "",
      description: "",
      header: <PortfolioStats />,
      className: "md:col-span-1",
    },
    {
      title: "",
      description: "",
      header: <SearchWidget />,
      className: "md:col-span-1 border-t-4 border-t-primary dark:border-t-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex text-white font-sans selection:bg-primary/30">
      {/* Sidebar / Navigation */}
      <nav className="w-20 md:w-64 border-r border-border hidden sm:flex flex-col p-4 bg-[#0a0a0f] z-10 sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 px-2 mb-10 text-primary">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">Q</div>
          <span className="font-bold text-xl hidden md:block text-white">QuantTrd</span>
        </div>

        <div className="flex-1 space-y-2">
          {[
            { icon: <LayoutDashboard size={20} />, label: "Dashboard" },
            { icon: <TrendingUp size={20} />, label: "Analysis" },
            { icon: <LineChart size={20} />, label: "Markets" },
            { icon: <Newspaper size={20} />, label: "News" },
            { icon: <Bell size={20} />, label: "Alerts" },
          ].map((item, i) => {
            const active = activeTab === item.label;
            return (
              <div
                key={i}
                onClick={() => setActiveTab(item.label)}
                className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${active ? 'text-white' : 'text-neutral-400 hover:bg-[#1a1a24] hover:text-white'}`}
              >
                {active && (
                  <motion.div
                    layoutId="navBackground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium hidden md:block">{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto space-y-2">
          {([
            { icon: <Settings size={20} />, label: "Settings" },
            { icon: <User size={14} />, label: "Profile" }
          ]).map((item, i) => {
            const active = activeTab === item.label;
            return (
              <div
                key={i}
                onClick={() => setActiveTab(item.label)}
                className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${active ? 'text-white' : 'text-neutral-400 hover:bg-[#1a1a24] hover:text-white'}`}
              >
                {active && (
                  <motion.div
                    layoutId="navBackground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  {item.label === 'Profile' ? (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${active ? 'bg-white text-primary' : 'bg-neutral-600 text-white'}`}>
                      {item.icon}
                    </div>
                  ) : item.icon}
                  <span className="font-medium hidden md:block">{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </nav>


      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto pb-24 sm:pb-8 relative">
        {/* QR Code / Share Button for PWA */}
        <button
          onClick={() => setShowQRModal(true)}
          className="absolute top-4 md:top-8 right-4 md:right-8 bg-primary/20 hover:bg-primary/40 text-primary p-2 rounded-full transition-colors z-20 flex items-center justify-center shadow-lg"
          title="Install App / Share"
        >
          <Share size={20} />
        </button>

        <header className="flex flex-col mb-8 pr-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{activeTab}</h1>
            <p className="text-neutral-400 mt-1">
              {activeTab === "Dashboard" && "Welcome back. Here's what's happening today."}
              {activeTab === "Analysis" && `Detailed analysis and technicals for ${selectedSymbol}.`}
              {activeTab === "Markets" && "Global market performance."}
              {activeTab === "News" && "Live financial news and market updates."}
              {activeTab === "Alerts" && "Your latest notifications."}
              {activeTab === "Settings" && "Manage your preferences."}
              {activeTab === "Profile" && "Your account details."}
            </p>
          </div>
        </header>

        {activeTab === "Dashboard" && (
          <BentoGrid className="max-w-6xl mx-auto md:auto-rows-[22rem]">
            {dashboardItems.map((item, i) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                header={item.header}
                className={item.className}
              />
            ))}
          </BentoGrid>
        )}

        {activeTab === "Analysis" && <AnalysisView symbol={selectedSymbol} />}

        {activeTab === "Markets" && <MarketsView onNavigate={handleNavigateAnalysis} />}
        {activeTab === "News" && <NewsView />}
        {activeTab === "Alerts" && <AlertsView />}
        {activeTab === "Settings" && <SettingsView />}
        {activeTab === "Profile" && <ProfileView />}
      </main>

      {/* Mobile Bottom Navigation Navbar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-md border-t border-border flex justify-around items-center p-2 z-50 pb-safe">
        {[
          { icon: <LayoutDashboard size={22} />, label: "Dashboard" },
          { icon: <LineChart size={22} />, label: "Markets" },
          { icon: <Newspaper size={22} />, label: "News" },
          { icon: <User size={22} />, label: "Profile" },
          { icon: <Settings size={22} />, label: "Settings" }
        ].map((item, i) => {
          const active = activeTab === item.label;
          return (
            <div
              key={i}
              onClick={() => setActiveTab(item.label)}
              className={`flex flex-col items-center justify-center w-full h-12 rounded-xl transition-colors ${active ? 'text-primary' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              {item.icon}
              <span className="text-[10px] sm:hidden font-medium mt-1">{item.label}</span>
            </div>
          )
        })}
      </nav>

      {/* QR Code PWA Install Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a24] border border-border p-6 rounded-3xl max-w-sm w-full relative text-center"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-2 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
              <h3 className="text-xl font-bold text-white mb-2">Install App on Phone</h3>
              <p className="text-sm text-neutral-400 mb-6 px-4">Scan this QR code with your mobile camera to open and install the app.</p>

              <div className="bg-white p-4 rounded-2xl mx-auto inline-block border-4 border-primary">
                <QRCodeSVG value={window.location.href} size={200} />
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <div className="text-xs text-neutral-500 bg-[#0a0a0f] p-3 rounded-lg border border-border">
                  <span className="font-bold text-success mb-1 block">iOS (Safari)</span>
                  Tap Share icon ➔ Add to Home Screen
                </div>
                <div className="text-xs text-neutral-500 bg-[#0a0a0f] p-3 rounded-lg border border-border">
                  <span className="font-bold text-success mb-1 block">Android (Chrome)</span>
                  Tap Menu ⋮ ➔ Install App
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
