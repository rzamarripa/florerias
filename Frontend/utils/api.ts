import { env } from "@/config/env";
import { useUserSessionStore } from "@/stores/userSessionStore";

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  [key: string]: any;
}

const getTokenFromSessionStore = () => {
  if (typeof window === "undefined") return null;
  try {
    const token = useUserSessionStore.getState().token;
    if (!token) {
      console.warn("No se encontró token en el store");
      return null;
    }
    return token;
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
  } else {
    console.warn("No se pudo obtener el token para los headers");
  }

  return headers;
};

export const apiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...getAuthHeaders(isFormData),
    ...(!isFormData && options.headers),
    ...(isFormData &&
      Object.fromEntries(
        Object.entries(options.headers || {}).filter(
          ([key]) => key.toLowerCase() !== "content-type"
        )
      )),
  };

  console.debug("Headers de la petición:", headers);

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error en la petición:", {
      status: response.status,
      statusText: response.statusText,
      data,
    });
    throw new Error(data.message || "Error en la operación");
  }

  return data;
};
