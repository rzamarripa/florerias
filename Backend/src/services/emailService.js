import nodemailer from "nodemailer";

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send password reset code email
export const sendPasswordResetCode = async (email, code) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Código de recuperación de contraseña - MaFlores",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #d63384;
              margin-bottom: 10px;
            }
            .code-box {
              background-color: #fff;
              border: 2px solid #d63384;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #d63384;
              letter-spacing: 5px;
            }
            .message {
              color: #666;
              font-size: 14px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              color: #999;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 5px;
              padding: 10px;
              margin-top: 20px;
              font-size: 13px;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌸 MaFlores</div>
              <h2>Recuperación de Contraseña</h2>
            </div>
            
            <p>Hola,</p>
            
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. 
            Utiliza el siguiente código para continuar con el proceso:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
              <div class="message">Este código expira en 10 minutos</div>
            </div>
            
            <div class="warning">
              ⚠️ Si no solicitaste este código, puedes ignorar este correo de manera segura. 
              Tu contraseña no será cambiada sin tu confirmación.
            </div>
            
            <p>Por razones de seguridad:</p>
            <ul>
              <li>No compartas este código con nadie</li>
              <li>Nuestro equipo nunca te pedirá este código</li>
              <li>El código solo es válido por 10 minutos</li>
            </ul>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} MaFlores - Todos los derechos reservados</p>
              <p>Este es un correo automático, por favor no responder.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Error al enviar el correo de recuperación");
  }
};

// Send password change confirmation email
export const sendPasswordChangeConfirmation = async (email, username) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Contraseña actualizada exitosamente - MaFlores",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #28a745;
              margin-bottom: 10px;
            }
            .success-icon {
              font-size: 48px;
              color: #28a745;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #999;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .info-box {
              background-color: #d4edda;
              border: 1px solid #28a745;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌸 MaFlores</div>
              <h2>Contraseña Actualizada</h2>
              <div class="success-icon">✅</div>
            </div>
            
            <p>Hola ${username},</p>
            
            <div class="info-box">
              <p><strong>Tu contraseña ha sido actualizada exitosamente.</strong></p>
              <p>Fecha y hora: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</p>
            </div>
            
            <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            
            <p><strong>¿No reconoces esta actividad?</strong></p>
            <p>Si no realizaste este cambio, por favor contacta inmediatamente a nuestro equipo de soporte.</p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} MaFlores - Todos los derechos reservados</p>
              <p>Este es un correo automático, por favor no responder.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password change confirmation sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password change confirmation:", error);
    // Don't throw error for confirmation email
    return { success: false, error: error.message };
  }
};