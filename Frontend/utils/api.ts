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

const getAuthHeaders = (isFormData: boolean = false) => {
  const token = getTokenFromSessionStore();
  const headers: Record<string, string> = {};
  
  // Solo agregar Content-Type si NO es FormData
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  // Agregar token si existe
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

export const apiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  // Determinar si el body es FormData
  const isFormData = options.body instanceof FormData;
  
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${url}`, {
    headers: {
      ...getAuthHeaders(isFormData),
      // Mantener headers adicionales que puedan venir en options
      ...(!isFormData && options.headers),
      // Si es FormData, omitir los headers de options para evitar conflictos
      ...(isFormData && Object.fromEntries(
        Object.entries(options.headers || {}).filter(
          ([key]) => key.toLowerCase() !== 'content-type'
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