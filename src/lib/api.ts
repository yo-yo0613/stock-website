// src/lib/api.ts

// Prefer same-origin Vercel Serverless FastAPI (/api) in production,
// automatically ignoring any legacy sleeping Render (onrender.com) env vars.
const resolveApiBase = (envUrl: string | undefined, defaultBase: string) => {
    if (import.meta.env.PROD) {
        if (!envUrl || envUrl.includes("onrender.com") || envUrl.includes("localhost")) {
            return defaultBase;
        }
        return envUrl;
    }
    if (envUrl && !envUrl.includes("onrender.com")) {
        return envUrl;
    }
    return defaultBase;
};

const API_BASE = resolveApiBase(import.meta.env.VITE_FASTAPI_URL, "/api");
const QUANT_BASE = resolveApiBase(import.meta.env.VITE_FASTAPI_QUANT_URL, "");

export const DEMO_MODE_STORAGE_KEY = "quanttrd_demo_mode";

export const getAuthToken = () => localStorage.getItem("jwt_token");
export const setAuthToken = (token: string) => localStorage.setItem("jwt_token", token);
export const removeAuthToken = () => localStorage.removeItem("jwt_token");

export const isDemoModeActive = () => localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "1";
export const enableDemoModeStorage = () => localStorage.setItem(DEMO_MODE_STORAGE_KEY, "1");
export const disableDemoModeStorage = () => localStorage.removeItem(DEMO_MODE_STORAGE_KEY);

interface RequestOptions extends RequestInit {
    body?: any;
}

// 統一 API Fetch（相容舊 .php 路徑並直連 Vercel Python FastAPI Serverless）
export const apiFetch = async (endpoint: string, options: RequestOptions = {}) => {
    const method = (options.method || "GET").toUpperCase();

    // 訪客體驗模式下，自選股與個人檔案寫入直接於本地生效，不發送雲端寫入請求避免 401
    if (
        isDemoModeActive() &&
        !getAuthToken() &&
        method !== "GET" &&
        (endpoint.startsWith("/watchlist") || endpoint.startsWith("/profile"))
    ) {
        return { success: true, demo: true };
    }

    const token = getAuthToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    if (options.body && typeof options.body !== "string") {
        config.body = JSON.stringify(options.body);
    }

    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = normalizedEndpoint.startsWith("/api/")
        ? normalizedEndpoint
        : `${API_BASE}${normalizedEndpoint}`;

    const response = await fetch(url, config);

    let data: any;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.error || data?.detail || `HTTP Error ${response.status}`);
    }

    return data;
};

// 專供量化行情與預測使用的 Fetch（同網域直連 Vercel Python FastAPI）
export const quantFetch = async (endpoint: string, options: RequestOptions = {}) => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    };

    const config: RequestInit = {
        ...options,
        headers,
    };

    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const response = await fetch(`${QUANT_BASE}${normalizedEndpoint}`, config);

    let data: any;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.error || data?.detail || `HTTP Error ${response.status}`);
    }

    return data;
};
