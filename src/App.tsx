import { useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { BentoGrid, BentoGridItem } from "./components/BentoGrid";
import { StockChart } from "./components/StockChart";
import { Watchlist } from "./components/Watchlist";
import { SearchWidget } from "./components/SearchWidget";
import { PortfolioStats } from "./components/PortfolioStats";
import { MarketsView, AlertsView, SettingsView, ProfileView, AnalysisView, NewsView } from "./components/Views";
import { SpreadsheetView } from "./components/SpreadsheetView";
import { ForumView } from "./components/ForumView";
import { LineChart, LayoutDashboard, Settings, Bell, User, TrendingUp, Newspaper, Share, LogOut, Database, MessageSquare } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useUser } from "./context/UserContext";
import { AuthScreen } from "./components/Auth";

const siteUrl = "https://stock-website-ad6i.vercel.app";

const routeConfig = [
  {
    path: "/",
    label: "Dashboard",
    description: "Welcome back. Here's what's happening today.",
    title: "QuantTrd | Dashboard",
  },
  {
    path: "/analysis",
    label: "Analysis",
    description: (symbol: string) => `Detailed analysis and technicals for ${symbol}.`,
    title: "QuantTrd | Analysis",
  },
  {
    path: "/data-studio",
    label: "Data Studio",
    description: "Upload and analyze your custom spreadsheets locally.",
    title: "QuantTrd | Data Studio",
  },
  {
    path: "/markets",
    label: "Markets",
    description: "Global market performance.",
    title: "QuantTrd | Markets",
  },
  {
    path: "/news",
    label: "News",
    description: "Live financial news and market updates.",
    title: "QuantTrd | News",
  },
  {
    path: "/forum",
    label: "Forum",
    description: "Community discussion and strategy sharing.",
    title: "QuantTrd | Forum",
  },
  {
    path: "/alerts",
    label: "Alerts",
    description: "Your latest notifications.",
    title: "QuantTrd | Alerts",
  },
  {
    path: "/settings",
    label: "Settings",
    description: "Manage your preferences.",
    title: "QuantTrd | Settings",
  },
  {
    path: "/profile",
    label: "Profile",
    description: "Your account details.",
    title: "QuantTrd | Profile",
  },
];

const RouteMeta = ({ title, description, url, image }: { title: string; description: string; url: string; image: string }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={url} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image} />
    <meta property="og:url" content={url} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
  </Helmet>
);

const DashboardView = ({ onNavigate }: { onNavigate: (symbol: string) => void }) => {
  const dashboardItems = [
    {
      title: "Market Performance",
      description: "S&P 500 integrated realtime heatmap and trajectory.",
      header: <StockChart onNavigate={() => onNavigate("AAPL")} />,
      className: "md:col-span-2",
    },
    {
      title: "Your Watchlist",
      description: "Tracked assets and rapid movements.",
      header: <Watchlist onNavigate={onNavigate} />,
      className: "md:col-span-1 md:row-span-2",
    },
    {
      title: "Portfolio Stats",
      description: "Live performance metrics for your portfolio.",
      header: <PortfolioStats />,
      className: "md:col-span-1",
    },
    {
      title: "Quick Search",
      description: "Search for stocks and market insight.",
      header: <SearchWidget />,
      className: "md:col-span-1 border-t-4 border-t-primary dark:border-t-primary",
    },
  ];

  return (
    <BentoGrid className="max-w-6xl mx-auto md:auto-rows-[22rem]">
      {dashboardItems.map((item, i) => (
        <BentoGridItem key={i} title={item.title} description={item.description} header={item.header} className={item.className} />
      ))}
    </BentoGrid>
  );
};

const getCurrentRoute = (pathname: string) => routeConfig.find(route => route.path === pathname) ?? routeConfig[0];

function AppContent() {
  const { session, loading, signOut } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [showQRModal, setShowQRModal] = useState(false);

  const currentRoute = useMemo(() => getCurrentRoute(location.pathname), [location.pathname]);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const routeSymbol = searchParams.get("symbol") || "AAPL";
  const pageDescription = typeof currentRoute.description === "function" ? currentRoute.description(routeSymbol) : currentRoute.description;
  const currentUrl = `${siteUrl}${location.pathname}`;

  const handleNavigateAnalysis = (sym: string) => {
    navigate(`/analysis?symbol=${encodeURIComponent(sym)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex text-white font-sans selection:bg-primary/30">
      <nav className="w-20 md:w-64 border-r border-border hidden sm:flex flex-col p-4 bg-[#0a0a0f] z-10 sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 px-2 mb-10 text-primary">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">Q</div>
          <span className="font-bold text-xl hidden md:block text-white">QuantTrd</span>
        </div>

        <div className="flex-1 space-y-2">
          {routeConfig.slice(0, 7).map((item, i) => (
            <NavLink
              key={i}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }: { isActive: boolean }) => `relative flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? 'text-white' : 'text-neutral-400 hover:bg-[#1a1a24] hover:text-white'}`}
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  {isActive && (
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
                    {item.path === '/' ? <LayoutDashboard size={20} /> : item.path === '/analysis' ? <TrendingUp size={20} /> : item.path === '/data-studio' ? <Database size={20} /> : item.path === '/markets' ? <LineChart size={20} /> : item.path === '/news' ? <Newspaper size={20} /> : item.path === '/forum' ? <MessageSquare size={20} /> : item.path === '/alerts' ? <Bell size={20} /> : null}
                    <span className="font-medium hidden md:block">{item.label}</span>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mt-auto space-y-2">
          {[routeConfig[7], routeConfig[8]].map((item, i) => (
            <NavLink
              key={i}
              to={item.path}
              className={({ isActive }: { isActive: boolean }) => `relative flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? 'text-white' : 'text-neutral-400 hover:bg-[#1a1a24] hover:text-white'}`}
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  {isActive && (
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
                    {item.path === '/settings' ? <Settings size={20} /> : <User size={14} />}
                    <span className="font-medium hidden md:block">{item.label}</span>
                  </div>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={signOut}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors text-red-500 hover:bg-red-500/10"
          >
            <LogOut size={20} />
            <span className="font-medium hidden md:block">Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto pb-24 sm:pb-8 relative">
        <button
          onClick={() => setShowQRModal(true)}
          className="absolute top-4 md:top-8 right-4 md:right-8 bg-primary/20 hover:bg-primary/40 text-primary p-2 rounded-full transition-colors z-20 flex items-center justify-center shadow-lg"
          title="Install App / Share"
        >
          <Share size={20} />
        </button>

        <header className="flex flex-col mb-8 pr-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{currentRoute.label}</h1>
            <p className="text-neutral-400 mt-1">{pageDescription}</p>
          </div>
        </header>

        <RouteMeta title={currentRoute.title} description={pageDescription} url={currentUrl} image={`${siteUrl}/quantTrd.png`} />

        <Routes>
          <Route path="/" element={<DashboardView onNavigate={handleNavigateAnalysis} />} />
          <Route path="/analysis" element={<AnalysisView symbol={routeSymbol} />} />
          <Route path="/data-studio" element={<SpreadsheetView />} />
          <Route path="/markets" element={<MarketsView onNavigate={handleNavigateAnalysis} />} />
          <Route path="/news" element={<NewsView />} />
          <Route path="/forum" element={<ForumView />} />
          <Route path="/alerts" element={<AlertsView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/profile" element={<ProfileView />} />
        </Routes>
      </main>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-md border-t border-border flex justify-around items-center p-2 z-50 pb-safe">
        {routeConfig.slice(0, 5).map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }: { isActive: boolean }) => `flex flex-col items-center justify-center w-full h-12 rounded-xl transition-colors ${isActive ? 'text-primary' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            {item.label === 'Dashboard' && <LayoutDashboard size={22} />}
            {item.label === 'Analysis' && <TrendingUp size={22} />}
            {item.label === 'Data Studio' && <Database size={22} />}
            {item.label === 'Markets' && <LineChart size={22} />}
            {item.label === 'News' && <Newspaper size={22} />}
            {item.label === 'Forum' && <MessageSquare size={22} />}
            <span className="text-[10px] mt-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border shadow-2xl p-6 rounded-3xl w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-4">Share or install QuantTrd</h2>
              <p className="text-neutral-400 mb-6">Scan the QR code or share the URL to install this app on your phone.</p>
              <div className="flex justify-center mb-6">
                <QRCodeSVG value={window.location.href} size={220} bgColor="#0a0a0f" fgColor="#ffffff" />
              </div>
              <button onClick={() => setShowQRModal(false)} className="w-full bg-primary text-black rounded-2xl py-3 font-semibold">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AppContent />
      </Router>
    </HelmetProvider>
  );
}

export default App;
