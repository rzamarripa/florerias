import { env } from "@/config/env";

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  [key: string]: any;
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

const getAuthHeaders = (isFormData: boolean = false) => {
  const token = getTokenFromSessionStore();
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const apiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${url}`, {
    headers: {
      ...getAuthHeaders(isFormData),
      ...(!isFormData && options.headers),
      ...(isFormData &&
        Object.fromEntries(
          Object.entries(options.headers || {}).filter(
            ([key]) => key.toLowerCase() !== "content-type"
          )
        )),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error en la operación");
  }

  return data;
};
