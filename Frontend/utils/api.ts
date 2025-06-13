import { env } from "@/config/env";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const getTokenFromSessionStore = () => {
  if (typeof window === "undefined") return null;

  try {
    const persistedState = localStorage.getItem("user-session");
    if (!persistedState) return null;

    const parsed = JSON.parse(persistedState);
    return parsed?.state?.token || null;
  } catch (error) {
    console.error("Error obteniendo token:", error);
    return null;
  }
};

const getAuthHeaders = () => {
  const token = getTokenFromSessionStore();

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const apiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${url}`, {
    headers: getAuthHeaders(),
    ...options,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Error en la operación");
  return data;
};
