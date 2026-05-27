// src/lib/api.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getAuthToken = () => localStorage.getItem("jwt_token");
export const setAuthToken = (token: string) => localStorage.setItem("jwt_token", token);
export const removeAuthToken = () => localStorage.removeItem("jwt_token");

interface RequestOptions extends RequestInit {
    body?: any;
}

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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
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
