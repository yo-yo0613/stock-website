# QuantTrd - Institutional-Grade Financial Terminal

QuantTrd is a high-performance, modern web application designed for retail investors and professionals. It provides a sleek, institutional-grade interface with real-time market data, interactive financial charts, Wall Street earnings forecasts, and a vibrant community forum.

## 🚀 Features

- **Microservices Architecture (Dual-Backend):**
  - **PHP Auth & User Management:** Handles secure authentication with JWT and Supabase PostgreSQL.
  - **Python FastAPI Quant Engine:** Powers real-time market data retrieval, auto-detects Taiwan stocks (`.TW`), and bypasses Yahoo Finance restrictions using `yfinance`.
  
- **Optimistic UI Watchlist:** 
  - Add or remove stocks from your watchlist with zero-latency visual feedback. 
  - Seamless background synchronization with the database.

- **Professional Market Analysis:**
  - Integrated with **TradingView Widgets** for real-time advanced charts, company profiles, heatmaps, and global market news.
  - Custom **Wall Street Earnings Forecast Widget** built with Recharts, displaying historical revenue, EPS trends, and analyst ratings.

- **In-App Social Forum:**
  - A modern, Threads/Twitter-like feed.
  - Supports Markdown, hashtag and mention highlighting, and embedded YouTube videos.
  - Integrated with **Cloudinary** for seamless image uploads.

- **Data Studio (Excel in Browser):**
  - Read, edit, and export `.xlsx` and `.csv` files directly in the browser using `SheetJS` and a custom Excel-like UI.

- **Progressive Web App (PWA):**
  - Installable on mobile and desktop with offline support and aggressive caching via `vite-plugin-pwa`.
  - Share via built-in QR Code generator.

- **Immersive Dark/Light Mode:**
  - Fully dynamic theming system utilizing Tailwind CSS custom variables and React state.

## 🛠️ Technology Stack

**Frontend:**
- React 19 (TypeScript) + Vite
- Tailwind CSS (with `tailwindcss-typography`)
- Framer Motion (Micro-animations)
- Recharts (Data Visualization)
- react-ts-tradingview-widgets
- SheetJS (Data Studio)

**Backend (Microservices):**
- **PHP 8.2:** Auth, Forum API, and PostgreSQL interactions via PDO.
- **Python FastAPI:** `yfinance` market data scraping and quant endpoints.

**Database & Cloud Services:**
- Supabase (PostgreSQL)
- Cloudinary (Image Hosting)
- Vercel (Frontend Deployment)
- Render (Dockerized Backend Deployment)

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yo-yo0613/stock-website.git
cd stock-website
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

### 3. Backend Setup
**PHP (Local XAMPP/Docker):**
- Ensure PHP 8.2+ with PDO and PostgreSQL extensions are enabled.
- Serve the `backend/api` directory on `localhost:8000`.
- Copy `.env.example` to `.env` and fill in your Supabase DB credentials.

**Python FastAPI:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 4. Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_PHP_API_URL=http://localhost:8000/api
VITE_PYTHON_API_URL=http://localhost:8001/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
```

## 🐳 Deployment

The project is designed to be fully decoupled:
1. **Frontend**: Deploy to Vercel and configure `VITE_PHP_API_URL` and `VITE_PYTHON_API_URL`.
2. **Backend**: A `Dockerfile` is provided in the root directory to deploy the PHP and Python services easily to Render or any Docker-compatible hosting.

---
*Disclaimer: This project is for educational purposes. It retrieves public financial data for informational use only.*
