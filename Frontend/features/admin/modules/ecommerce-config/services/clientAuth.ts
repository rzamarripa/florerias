import { env } from "@/config/env";
import type { ClientSession } from "@/stores/clientSessionStore";

export interface ClientLoginCredentials {
  email: string;
  password: string;
}

export interface ClientLoginResponse {
  success: boolean;
  message: string;
  data?: {
    client: ClientSession;
    token: string;
  };
}

export class ClientAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientAuthError";
  }
}

export const clientLoginService = async (
  credentials: ClientLoginCredentials
): Promise<ClientLoginResponse> => {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/client-auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ClientAuthError(data.message || "Error en el servidor");
    }

    return data;
  } catch (error) {
    if (error instanceof ClientAuthError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ClientAuthError(
        "Error de conexión. Verifica tu conexión a internet."
      );
    }

    throw new ClientAuthError("Error inesperado. Intenta nuevamente.");
  }
};

export const saveClientToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("clientAuthToken", token);
  }
};

export const getClientToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("clientAuthToken");
  }
  return null;
};

export const removeClientToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("clientAuthToken");
  }
};
