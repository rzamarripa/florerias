import { env } from "@/config/env";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: any;
    role: string | null;
    allowedModules: any[];
    token: string;
  };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export const loginService = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AuthError(data.message || "Error en el servidor");
    }

    return data;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new AuthError(
        "Error de conexión. Verifica tu conexión a internet."
      );
    }

    throw new AuthError("Error inesperado. Intenta nuevamente.");
  }
};

export const saveAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token);
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
};

export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
  }
};
