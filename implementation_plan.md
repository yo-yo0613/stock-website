# 專案實作計畫：微動畫升級與 Yahoo Finance 股票資料整合

這個計畫將會把你的網站提升到一個全新的境界！我們不僅會加入大量順暢、有質感的「微動畫（Micro-interactions）」，還會串接真正的 Yahoo Finance 股票資料，讓你的網站數據「動起來」。

---

## 📌 核心目標
1. 建立前端到 Yahoo Finance 的資料連線（解決 CORS 問題）。
2. 在 `Watchlist` 和 `StockChart` 中綁定股市即時或歷史資料。
3. 利用 Framer Motion 加入高質感的微互動（懸浮特效、進場特效、數字跳動特效）。

---

## 🛑 User Review Required

> [!WARNING]
> 因為 Yahoo! Finance API 會有 CORS （跨網域資源共用）的防護，瀏覽器是不允許我們直接發送請求的。
> 我的解決方案是：**透過修改 `vite.config.ts` 加入一個本地端的 Proxy 伺服器**。這代表你可以完美在本地端 (`npm run dev`) 獲取數據。如果你未來要發布上線 (例如 Vercel)，則需要另外配置 Serverless function。
> **請問你同意目前的 Vite Proxy 開發配置嗎？**

---

## 🛠 Proposed Changes

### Vite 設定與架構更新
我們首先要配置本地端反向代理，讓我們能呼叫 Yahoo API。

#### [MODIFY] [vite.config.ts](file:///c:/Users/14L1/Desktop/Bento-grid/vite.config.ts)
- 加入 `server.proxy` 設定，將所有的 `/api/finance` 請求轉向 `https://query1.finance.yahoo.com`。

---

### 微動畫與視覺特效升級

我們將大幅運用你已安裝的 `framer-motion`。

#### [MODIFY] [BentoGrid.tsx](file:///c:/Users/14L1/Desktop/Bento-grid/src/components/BentoGrid.tsx)
- 在 `BentoGridItem` 加上 `whileHover={{ scale: 1.02, y: -4 }}` 創造懸浮彈性。
- 加入 Cursor-following (滑鼠跟隨) 的光暈效果，讓卡片邊緣在 hover 時有點亮的未來感（Linear Style）。
- 讓卡片在初次載入時有階層式進場動畫 (Staggered fade-in)。

#### [MODIFY] [App.tsx](file:///c:/Users/14L1/Desktop/Bento-grid/src/App.tsx)
- 為左側導覽列的切換按鈕加入 `layoutId`，在背景色塊跳動時實現平滑移動 (Shared Element Transition)。

---

### Yahoo Finance 資料串接

我們將拋棄假資料，改寫元件以獲取並處理真實資料。

#### [MODIFY] [Watchlist.tsx](file:///c:/Users/14L1/Desktop/Bento-grid/src/components/Watchlist.tsx)
- 使用 `useEffect` 呼叫 `/api/finance/v7/finance/quote?symbols=AAPL,GOOGL,MSFT,NVDA,TSLA`。
- 載入資料時加入 `Skeleton` (骨架屏) 動畫。
- 顯示真實的即時價格、單日漲跌幅，當數字更新時，價格加上閃爍 (Flash) 特效。
- 將列表轉換為 `<motion.li>` 並搭配錯開進場 (staggerChildren) 特效。

#### [MODIFY] [StockChart.tsx](file:///c:/Users/14L1/Desktop/Bento-grid/src/components/StockChart.tsx)
- 呼叫 `/api/finance/v8/finance/chart/AAPL?interval=15m&range=1d`，獲取真實當日走勢。
- 將 Yahoo 回傳的 UNIX Timestamp 轉為時間標籤，關聯給 `recharts`。
- 當資料切換時，圖表會帶有平滑重新繪製的漸變動畫。

---

## ❓ Open Questions

> [!CAUTION]
> 1. 原本的 API 更新頻率你想設定多少？例如：每 30 秒自動抓取更新一次資料，還是使用者自己重整就好？
> 2. 微動畫的風格，你偏好「彈跳可愛 (Bouncy)」還是「滑順沉穩 (Smooth/Linear)」？

---

## 🧪 Verification Plan

### Manual Verification
1. 重啟 `npm run dev` 以確保 Vite Proxy 設定生效。
2. 進入頁面，觀察卡片是否能順暢進入，並嘗試用游標 Hover 卡片感受彈性和光暈。
3. 觀察 Watchlist 是否能在抓取 1 秒後成功顯示真實的 AAPL, GOOGL, MSFT 價格，對照實際股市 (若美股開盤中可能會波動)。
4. 點擊不同 Tab，確認按鈕背景滑動自然流暢。
