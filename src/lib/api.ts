// src/lib/api.ts

const PHP_API_BASE = import.meta.env.VITE_PHP_API_URL || "http://localhost:8000/api";
const PYTHON_API_BASE = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8001";

export const getAuthToken = () => localStorage.getItem("jwt_token");
export const setAuthToken = (token: string) => localStorage.setItem("jwt_token", token);
export const removeAuthToken = () => localStorage.removeItem("jwt_token");

interface RequestOptions extends RequestInit {
    body?: any;
}

// 預設的 API Fetch (給 PHP 用的)
export const apiFetch = async (endpoint: string, options: RequestOptions = {}) => {
    const token = getAuthToken();
    
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    if (options.body && typeof options.body !== 'string') {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${PHP_API_BASE}${endpoint}`, config);
    
    // Parse JSON
    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.error || `HTTP Error ${response.status}`);
    }

    return data;
};

// 專門給 Python Quant API 用的 Fetch
export const quantFetch = async (endpoint: string, options: RequestOptions = {}) => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {})
    };

    const config: RequestInit = {
        ...options,
        headers,
    };

    const response = await fetch(`${PYTHON_API_BASE}${endpoint}`, config);
    
    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.error || `HTTP Error ${response.status}`);
    }

    return data;
};

