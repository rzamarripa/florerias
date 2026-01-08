import { env } from "@/config/env";

export interface SendResetCodeResponse {
  success: boolean;
  message: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    codeId: string;
  };
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Send reset code to email
export const sendResetCode = async (email: string): Promise<SendResetCodeResponse> => {
  try {
    const url = `${env.NEXT_PUBLIC_API_URL}/password-reset/send-code`;
    console.log("Enviando petición a:", url);
    console.log("Email:", email);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    console.log("Respuesta status:", response.status);
    const data = await response.json();
    console.log("Datos recibidos:", data);
    return data;
  } catch (error) {
    console.error("Error sending reset code:", error);
    return {
      success: false,
      message: "Error al enviar el código. Por favor intenta de nuevo.",
    };
  }
};

// Verify reset code
export const verifyResetCode = async (
  email: string,
  code: string
): Promise<VerifyCodeResponse> => {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/password-reset/verify-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error verifying code:", error);
    return {
      success: false,
      message: "Error al verificar el código. Por favor intenta de nuevo.",
    };
  }
};

// Reset password with verified code
export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string
): Promise<ResetPasswordResponse> => {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/password-reset/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        code,
        newPassword,
        confirmPassword,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      message: "Error al actualizar la contraseña. Por favor intenta de nuevo.",
    };
  }
};