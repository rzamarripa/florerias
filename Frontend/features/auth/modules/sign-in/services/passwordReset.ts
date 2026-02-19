import { env } from "@/config/env";
import { sendPasswordResetCode, sendPasswordChangeConfirmation } from "@/services/emailService";

export interface SendResetCodeResponse {
  success: boolean;
  message: string;
  data?: {
    code: string;
    email: string;
    username: string;
  };
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
  data?: {
    email: string;
    username: string;
  };
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
    
    // Si el Backend generó el código exitosamente, enviar el email desde el Frontend
    if (data.success && data.data?.code && data.data?.email) {
      try {
        console.log("Enviando email con código desde Frontend...");
        const emailResult = await sendPasswordResetCode({
          to: data.data.email,
          code: data.data.code,
          userName: data.data.username || 'Usuario',
          companyName: 'Zolt'
        });
        
        if (!emailResult.success) {
          console.error("Error enviando email:", emailResult.error);
          // Aunque el email falle, el código ya fue generado
          return {
            success: true,
            message: "Código generado. Si el correo existe en nuestro sistema, recibirás un código de recuperación."
          };
        }
        
        console.log("Email enviado exitosamente");
        return {
          success: true,
          message: "Código de recuperación enviado al correo electrónico"
        };
      } catch (emailError) {
        console.error("Error enviando email:", emailError);
        return {
          success: true,
          message: "Código generado. Si el correo existe en nuestro sistema, recibirás un código de recuperación."
        };
      }
    }
    
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
    
    // Si el password se actualizó exitosamente, enviar email de confirmación
    if (data.success && data.data?.email) {
      try {
        console.log("Enviando email de confirmación desde Frontend...");
        await sendPasswordChangeConfirmation({
          to: data.data.email,
          userName: data.data.username || 'Usuario',
          companyName: 'Zolt'
        });
        console.log("Email de confirmación enviado exitosamente");
      } catch (emailError) {
        console.error("Error enviando email de confirmación:", emailError);
        // No afectar el resultado aunque el email de confirmación falle
      }
    }
    
    return data;
  } catch (error) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      message: "Error al actualizar la contraseña. Por favor intenta de nuevo.",
    };
  }
};