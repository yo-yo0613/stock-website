from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from datetime import datetime
import traceback

app = FastAPI(title="QuantTrd API", version="1.0.0")

# Allow requests from your Vercel frontend and local dev environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://stock-website-ad6i.vercel.app", 
        "*"  # For development; recommend restricting to exact domains in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def yf_symbol(code: str, market: str):
    code = str(code).strip().upper()
    if market == "台股" or (code.isdigit() and len(code) == 4):
        return code + ".TW"
    return code

def calc_rsi(prices, period=14):
    if len(prices) < period + 1:
        return None
    deltas = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]
    if not losses:
        return 100.0
    if not gains:
        return 0.0

    ag = sum(gains[:period]) / period
    al = sum(losses[:period]) / period
    for i in range(period, len(deltas)):
        ag = (ag * (period - 1) + gains[i]) / period
        al = (al * (period - 1) + losses[i]) / period
    return round(100 - (100 / (1 + (ag / al if al else 999))), 1)

def fetch_stock_data(sym: str):
    try:
        tk = yf.Ticker(sym)
        info = tk.info
        hist = tk.history(period="3mo")
        price = info.get("currentPrice") or info.get("regularMarketPrice")
        prev = info.get("regularMarketPreviousClose") or price
        closes = list(hist["Close"].round(2)) if not hist.empty else []
        
        return {
            "symbol": sym,
            "price": price,
            "change": round(price - prev, 2) if price and prev else 0,
            "pct": round((price - prev) / prev * 100, 2) if prev else 0,
            "open": info.get("regularMarketOpen"),
            "high": info.get("regularMarketDayHigh"),
            "low": info.get("regularMarketDayLow"),
            "w52h": info.get("fiftyTwoWeekHigh"),
            "w52l": info.get("fiftyTwoWeekLow"),
            "volume": info.get("volume"),
            "avg_vol": info.get("averageVolume10days"),
            "mktcap": round(info.get("marketCap", 0) / 1e9, 1) if info.get("marketCap") else None,
            "eps": info.get("trailingEps"),
            "pe": round(info.get("trailingPE"), 1) if info.get("trailingPE") else None,
            "pb": round(info.get("priceToBook"), 1) if info.get("priceToBook") else None,
            "revenue": round(info.get("totalRevenue", 0) / 1e9, 1) if info.get("totalRevenue") else None,
            "gm": round(info.get("grossMargins", 0) * 100, 1) if info.get("grossMargins") else None,
            "roe": round(info.get("returnOnEquity", 0) * 100, 1) if info.get("returnOnEquity") else None,
            "ma5": round(sum(closes[-5:]) / 5, 2) if len(closes) >= 5 else None,
            "ma20": round(sum(closes[-20:]) / 20, 2) if len(closes) >= 20 else None,
            "ma60": round(sum(closes[-60:]) / 60, 2) if len(closes) >= 60 else None,
            "rsi": calc_rsi(closes),
            "dividend": info.get("dividendRate"),
            "div_yield": round(info.get("dividendYield", 0) * 100, 2) if info.get("dividendYield") else None,
            "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception as e:
        print(f"Error fetching {sym}: {e}")
        traceback.print_exc()
        return None

@app.get("/")
def read_root():
    return {"status": "ok", "message": "QuantTrd API is running."}

@app.get("/api/market/quote")
def get_quote(symbol: str, market: str = "美股"):
    """
    Fetch live data from Yahoo Finance.
    market parameter can be '美股' or '台股'
    """
    sym = yf_symbol(symbol, market)
    data = fetch_stock_data(sym)
    
    if not data or not data.get("price"):
        raise HTTPException(status_code=404, detail=f"Failed to fetch data for symbol {symbol}")
        
    return {
        "success": True,
        "data": data
    }
