# QuantTrd - Institutional-Grade Financial Terminal / 機構級金融分析終端機

[English](#english) | [繁體中文](#繁體中文)

---

<h2 id="english">🇬🇧 English</h2>

QuantTrd is a high-performance, modern web application designed for retail investors and professionals. It provides a sleek, institutional-grade interface with real-time market data, interactive financial charts, Wall Street earnings forecasts, and a vibrant community forum.

### 🚀 Features

- **Microservices Architecture (Dual-Backend):**
  - **PHP Auth & User Management:** Handles secure authentication with JWT and Supabase PostgreSQL.
  - **Python FastAPI Quant Engine:** Powers real-time market data retrieval, auto-detects Taiwan stocks (`.TW`), and bypasses Yahoo Finance restrictions using `yfinance`.
  
- **Optimistic UI Watchlist:** Add or remove stocks from your watchlist with zero-latency visual feedback. 
- **Professional Market Analysis:** Integrated with **TradingView Widgets** and a custom **Wall Street Earnings Forecast Widget** built with Recharts.
- **In-App Social Forum:** A modern, Threads/Twitter-like feed with Cloudinary image uploads and hashtag parsing.
- **Data Studio (Excel in Browser):** Read, edit, and export `.xlsx` and `.csv` files directly in the browser using `SheetJS`.
- **Progressive Web App (PWA):** Installable on mobile and desktop with offline support.
- **Immersive Dark/Light Mode:** Fully dynamic theming system utilizing Tailwind CSS custom variables.

### 🛠️ Technology Stack
- **Frontend:** React 19 (TypeScript), Vite, Tailwind CSS, Framer Motion, Recharts
- **Backend:** PHP 8.2 (Auth/DB), Python FastAPI (Quant Data)
- **Cloud:** Supabase (PostgreSQL), Cloudinary (Images), Vercel (Frontend), Render (Backend)

---

<h2 id="繁體中文">🇹🇼 繁體中文</h2>

QuantTrd 是一個專為散戶與專業投資人打造的高效能、現代化 Web 應用程式。它提供了極具質感的機構級操作介面，並整合了即時市場數據、互動式金融圖表、華爾街獲利預估，以及一個充滿活力的社群投資論壇。

### 🚀 核心亮點功能

- **雙後端微服務架構 (Microservices Architecture):**
  - **PHP 會員系統:** 負責高度安全的 JWT 認證，並透過 PDO 串接 Supabase PostgreSQL。
  - **Python FastAPI 量化引擎:** 負責抓取即時市場報價，具備台股智慧偵測 (`.TW` 自動補齊)，並利用 `yfinance` 完美突破 Yahoo Finance 的反爬蟲限制。
  
- **樂觀 UI 自選股 (Optimistic Watchlist):** 體驗「零延遲」的新增/刪除自選股手感，前端畫面瞬間反應，背景自動無縫同步資料庫。
- **專業級市場分析:** 內建 **TradingView** 高階即時圖表與市場熱力圖，並透過 Recharts 自行刻畫了對標專業軟體的「華爾街分析師預測儀表板」。
- **沉浸式社群論壇:** 打造出類似 Threads / X 的現代化無接縫動態牆，支援 Cloudinary 無伺服器圖片上傳、YouTube 影片內嵌與自動標籤高亮 (Hashtags/Mentions)。
- **Data Studio (雲端試算表):** 利用 `SheetJS` 在瀏覽器內直接讀取、編輯並匯出 `.xlsx` 與 `.csv` 檔案，完美貼合專業投資人的 Excel 使用習慣。
- **PWA (漸進式網頁應用):** 支援離線快取，並可透過內建的 QR Code 生成器「一鍵安裝」至手機或電腦桌面，擁有原生 App 般的操作體驗。
- **深淺色動態主題:** 透過 Tailwind CSS 變數完美實作的系統級 Dark / Light Mode 切換。

### 🛠️ 技術堆疊 (Tech Stack)
- **前端:** React 19 (TypeScript), Vite, Tailwind CSS, Framer Motion, Recharts
- **後端:** PHP 8.2 (會員認證/資料庫交互), Python FastAPI (量化運算與爬蟲)
- **雲端服務:** Supabase (PostgreSQL), Cloudinary (圖片託管), Vercel (前端部署), Render (Docker 後端部署)

### 📦 快速開始

**1. 複製專案**
```bash
git clone https://github.com/yo-yo0613/stock-website.git
cd stock-website
```

**2. 前端設定 (Frontend)**
```bash
npm install
npm run dev
```

**3. 後端設定 (Backend)**
- **PHP:** 將 `backend/api` 放置於本機伺服器 (如 XAMPP)，並確保支援 PHP 8.2+ 與 PDO_PgSQL。
- **Python:** 
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

**4. 環境變數**
在根目錄建立 `.env.local`：
```env
VITE_PHP_API_URL=http://localhost:8000/api
VITE_PYTHON_API_URL=http://localhost:8001/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
```

---
*免責聲明：此專案為學術展示與學習用途，所有獲取的金融數據僅供參考，不構成任何投資建議。*
