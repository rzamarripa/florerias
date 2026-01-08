import { User } from "../models/User.js";
import { PasswordResetCode } from "../models/PasswordResetCode.js";
import { sendPasswordResetCode, sendPasswordChangeConfirmation } from "../services/emailService.js";

// Generate 6-digit code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    console.log("Buscando usuario con email o username:", email.toLowerCase());
    
    // Find user by email OR username (since users might enter either)
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() }
      ]
    });
    console.log("Usuario encontrado:", user ? "Sí" : "No");
    
    if (!user) {
      console.log("Usuario no encontrado para email:", email);
      // Don't reveal if email exists for security
      return res.status(200).json({
        success: true,
        message: "Si el correo existe en nuestro sistema, recibirás un código de recuperación"
      });
    }

    console.log("Usuario encontrado:", user.username, "Email real:", user.email);
    
    // IMPORTANTE: Usar el email real del usuario, no lo que ingresó
    const userEmail = user.email;

    // Invalidate any existing codes for this user's email
    await PasswordResetCode.updateMany(
      { email: userEmail.toLowerCase(), used: false },
      { $set: { expired: true } }
    );

    // Generate new code
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log("Código generado:", code);

    // Save code to database with the user's actual email
    const resetCode = new PasswordResetCode({
      email: userEmail.toLowerCase(),
      code,
      expiresAt,
      used: false,
      expired: false
    });

    const savedCode = await resetCode.save();
    console.log("Código guardado en BD con ID:", savedCode._id);

    // Send email to the user's actual email address
    console.log("Enviando email a:", userEmail, "con código:", code);
    await sendPasswordResetCode(userEmail, code);
    console.log("Email enviado exitosamente");

    return res.status(200).json({
      success: true,
      message: "Código de recuperación enviado al correo electrónico"
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

    // First find the user (could be by username or email)
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Código inválido"
      });
    }

    // Find the reset code using the user's actual email
    const resetCode = await PasswordResetCode.findOne({
      email: user.email.toLowerCase(),
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
        email: user.email,  // Return the user's actual email
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

    // First find the user (could be by username or email)
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Find and validate the reset code using the user's actual email
    const resetCode = await PasswordResetCode.findOne({
      email: user.email.toLowerCase(),
      code: code.trim()
    });

    if (!resetCode || !resetCode.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Código inválido o expirado"
      });
    }

    // Update password (user already found above)
    user.password = newPassword;
    await user.save(); // This will trigger the pre-save hook to hash the password

    // Mark code as used
    await resetCode.markAsUsed();

    // Send confirmation email
    await sendPasswordChangeConfirmation(user.email, user.username);

    return res.status(200).json({
      success: true,
      message: "Contraseña actualizada exitosamente"
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