import { env } from "@/config/env";
import { useUserSessionStore } from "@/stores/userSessionStore";

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

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers,
  });

  // Verificar el tipo de contenido antes de intentar parsear JSON
  const contentType = response.headers.get("content-type");
  let data;

  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError);
      throw new Error("Respuesta del servidor no es JSON válido");
    }
  } else {
    // Si no es JSON, leer como texto
    const textData = await response.text();
    console.error("Respuesta no-JSON recibida:", {
      status: response.status,
      statusText: response.statusText,
      contentType,
      data: textData,
    });

    // Intentar crear un objeto de error estructurado
    data = {
      success: false,
      message:
        textData || `Error HTTP ${response.status}: ${response.statusText}`,
      data: null,
    };
  }



  // Verificar errores de permisos (interceptor devuelve 200 con success: false)
  if (data && data.success === false && data.permissionDenied) {
    // Error de permisos: devolver respuesta "exitosa" pero con success: false
    // Esto evita que Next.js muestre alertas de error, el toast ya se mostró
    return {
      success: false,
      message: data.message || "Sin permisos para realizar esta operación",
      data: null as any,
      permissionDenied: true
    } as ApiResponse<T>;
  }

  if (!response.ok) {
    // Para errores 400 (Bad Request) con mensaje del servidor, tratarlos como respuestas válidas
    // Estos son errores de validación del negocio, no errores técnicos
    if (response.status === 400 && data && data.message) {
      return {
        success: false,
        message: data.message,
        data: data.data || null,
        issues: data.issues || null
      } as ApiResponse<T>;
    }

    // Solo loggear errores que no sean 404 de tarjetas digitales
    const isDigitalCard404 = response.status === 404 && 
                            url.includes('/digital-cards/') && 
                            data?.message?.toLowerCase().includes('no encontrada');
    
    if (!isDigitalCard404) {
      console.error("Error en la petición:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });
    }

    // Manejo especial para errores 429
    if (response.status === 429) {
      throw new Error(
        "Demasiadas peticiones. Por favor, espera un momento antes de intentar nuevamente."
      );
    }

    throw new Error(data.message || "Error en la operación");
  }

  return data;
};
