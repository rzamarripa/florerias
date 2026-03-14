import { User } from "../models/User.js";
import { PasswordResetCode } from "../models/PasswordResetCode.js";
import {
  sendPasswordResetCode as sendResetEmail,
  sendPasswordChangeConfirmation,
} from "../services/emailService.js";

// Generate 6-digit code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Find user by email, username, or the local part of an email as username
const findUserByEmailOrUsername = async (input) => {
  const lower = input.toLowerCase();
  const localPart = lower.includes("@") ? lower.split("@")[0] : null;

  const orConditions = [
    { email: lower },
    { username: lower }
  ];
  if (localPart) {
    orConditions.push({ username: localPart });
  }

  return User.findOne({ $or: orConditions });
};

// Send password reset code
export const sendResetCode = async (req, res) => {
  try {
    console.log("=== PASSWORD RESET REQUEST ===");
    console.log("Body received:", req.body);
    const { email } = req.body;

    if (!email) {
      console.log("Error: Email no proporcionado");
      return res.status(400).json({
        success: false,
        message: "El correo electrónico es requerido"
      });
    }

    const targetEmail = email.toLowerCase();

    // Optionally find user for greeting name and to store userId (but don't block if not found)
    const user = await findUserByEmailOrUsername(targetEmail);
    console.log("Usuario encontrado:", user ? "Sí" : "No");

    // Invalidate any existing codes for this email
    await PasswordResetCode.updateMany(
      { email: targetEmail, used: false },
      { $set: { expired: true } }
    );

    // Generate new code
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log("Código generado:", code);

    // Save code to database with the entered email and userId if found
    const resetCode = new PasswordResetCode({
      email: targetEmail,
      userId: user?._id || null,
      code,
      expiresAt,
      used: false,
      expired: false
    });

    const savedCode = await resetCode.save();
    console.log("Código guardado en BD con ID:", savedCode._id);

    // Send email with the code to the entered email
    try {
      await sendResetEmail({
        to: targetEmail,
        code,
        userName: user?.username || "Usuario",
      });
      console.log("Email de recuperación enviado a:", targetEmail);
    } catch (emailError) {
      console.error("Error enviando email de recuperación:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Se ha enviado un código de recuperación al correo proporcionado",
    });

  } catch (error) {
    console.error("Error sending reset code:", error);
    return res.status(500).json({
      success: false,
      message: "Error al enviar el código de recuperación"
    });
  }
};

// Verify reset code
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email y código son requeridos"
      });
    }

    // Find the reset code directly by the entered email
    const resetCode = await PasswordResetCode.findOne({
      email: email.toLowerCase(),
      code: code.trim()
    });

    if (!resetCode) {
      return res.status(400).json({
        success: false,
        message: "Código inválido"
      });
    }

    // Check if code is valid
    if (!resetCode.isValid()) {
      return res.status(400).json({
        success: false,
        message: resetCode.expired ? "El código ha expirado" : "El código ya ha sido utilizado"
      });
    }

    // Code is valid - don't mark as used yet (will be done when password is reset)
    return res.status(200).json({
      success: true,
      message: "Código válido",
      data: {
        email: resetCode.email,
        codeId: resetCode._id
      }
    });

  } catch (error) {
    console.error("Error verifying reset code:", error);
    return res.status(500).json({
      success: false,
      message: "Error al verificar el código"
    });
  }
};

// Reset password with verified code
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Las contraseñas no coinciden"
      });
    }

    if (newPassword.length < 3) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 3 caracteres"
      });
    }

    // Find and validate the reset code by the entered email
    const resetCode = await PasswordResetCode.findOne({
      email: email.toLowerCase(),
      code: code.trim()
    });

    if (!resetCode || !resetCode.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Código inválido o expirado"
      });
    }

    // Find the user: first by userId stored in the code, then fallback to email/username
    let user = null;
    if (resetCode.userId) {
      user = await User.findById(resetCode.userId);
    }
    if (!user) {
      user = await findUserByEmailOrUsername(email);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Update password
    user.password = newPassword;
    await user.save(); // This will trigger the pre-save hook to hash the password

    // Mark code as used
    await resetCode.markAsUsed();

    // Enviar email de confirmación desde el Backend
    try {
      await sendPasswordChangeConfirmation({
        to: user.email,
        userName: user.username || "Usuario",
      });
      console.log("Email de confirmación enviado a:", user.email);
    } catch (emailError) {
      console.error("Error enviando email de confirmación:", emailError);
    }

    console.log("Contraseña actualizada para:", user.username);

    return res.status(200).json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });

  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar la contraseña"
    });
  }
};

// Check if user has reset code pending (optional endpoint)
export const checkResetStatus = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email es requerido"
      });
    }

    const hasValidCode = await PasswordResetCode.findOne({
      email: email.toLowerCase(),
      used: false,
      expired: false,
      expiresAt: { $gt: new Date() }
    });

    return res.status(200).json({
      success: true,
      hasValidCode: !!hasValidCode
    });

  } catch (error) {
    console.error("Error checking reset status:", error);
    return res.status(500).json({
      success: false,
      message: "Error al verificar el estado"
    });
  }
};