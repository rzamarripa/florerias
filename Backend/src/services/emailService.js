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

// Send Google Wallet card email
export const sendGoogleWalletCard = async (clientData, saveUrl, companyName = "Corazón Violeta") => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: clientData.email,
      subject: `Tu Tarjeta Digital está Lista - ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.95;
            }
            .content {
              padding: 40px 30px;
            }
            .card-preview {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              padding: 20px;
              margin: 25px 0;
              color: white;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }
            .card-preview .card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
            }
            .card-preview .card-title {
              font-size: 18px;
              font-weight: bold;
            }
            .card-preview .card-type {
              font-size: 12px;
              background: rgba(255,255,255,0.2);
              padding: 4px 10px;
              border-radius: 12px;
            }
            .card-preview .card-details {
              margin: 15px 0;
            }
            .card-preview .detail-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
              font-size: 14px;
            }
            .card-preview .detail-label {
              opacity: 0.9;
            }
            .card-preview .detail-value {
              font-weight: 600;
            }
            .card-preview .points {
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
              padding: 15px;
              background: rgba(255,255,255,0.1);
              border-radius: 8px;
            }
            .wallet-button {
              display: block;
              width: 100%;
              max-width: 300px;
              margin: 30px auto;
              padding: 16px 32px;
              background-color: #000;
              color: white;
              text-decoration: none;
              text-align: center;
              border-radius: 50px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);
              transition: transform 0.3s ease;
            }
            .wallet-button:hover {
              transform: translateY(-2px);
            }
            .wallet-icon {
              vertical-align: middle;
              margin-right: 10px;
              font-size: 20px;
            }
            .benefits {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
            }
            .benefits h3 {
              color: #667eea;
              margin-top: 0;
              font-size: 18px;
            }
            .benefits ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .benefits li {
              margin: 8px 0;
              color: #666;
            }
            .instructions {
              background-color: #fff8e1;
              border-left: 4px solid #ffc107;
              padding: 15px 20px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .instructions h4 {
              margin-top: 0;
              color: #f57c00;
              font-size: 16px;
            }
            .instructions ol {
              margin: 10px 0;
              padding-left: 20px;
              color: #666;
            }
            .instructions li {
              margin: 8px 0;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            .footer p {
              color: #6c757d;
              font-size: 14px;
              margin: 5px 0;
            }
            .footer .company {
              font-weight: 600;
              color: #667eea;
              margin-bottom: 10px;
            }
            .divider {
              height: 1px;
              background-color: #e9ecef;
              margin: 30px 0;
            }
            @media (max-width: 600px) {
              .content {
                padding: 30px 20px;
              }
              .wallet-button {
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Tu Tarjeta Digital está Lista!</h1>
              <p>Guárdala en Google Wallet y disfruta de todos los beneficios</p>
            </div>
            
            <div class="content">
              <p style="font-size: 16px; color: #555;">Hola <strong>${clientData.name} ${clientData.lastName}</strong>,</p>
              
              <p style="color: #666;">Tu tarjeta de fidelidad digital ha sido creada exitosamente. Ahora puedes agregarla a Google Wallet para tenerla siempre contigo.</p>
              
              <div class="card-preview">
                <div class="card-header">
                  <div class="card-title">${companyName}</div>
                  <div class="card-type">TARJETA DIGITAL</div>
                </div>
                <div class="card-details">
                  <div class="detail-row">
                    <span class="detail-label">Miembro:</span>
                    <span class="detail-value">${clientData.name} ${clientData.lastName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Número de Cliente:</span>
                    <span class="detail-value">${clientData.clientNumber}</span>
                  </div>
                </div>
                <div class="points">
                  ${clientData.points || 0} PUNTOS
                </div>
              </div>
              
              <a href="${saveUrl}" class="wallet-button" style="color: white;">
                <span class="wallet-icon">📱</span>
                Agregar a Google Wallet
              </a>
              
              <div class="benefits">
                <h3>✨ Beneficios de tu Tarjeta Digital</h3>
                <ul>
                  <li>Acumula puntos en cada compra</li>
                  <li>Accede a promociones exclusivas</li>
                  <li>Consulta tu saldo en tiempo real</li>
                  <li>Recibe notificaciones de ofertas especiales</li>
                  <li>Sin necesidad de llevar tarjetas físicas</li>
                </ul>
              </div>
              
              <div class="instructions">
                <h4>📲 ¿Cómo agregar tu tarjeta?</h4>
                <ol>
                  <li>Haz clic en el botón "Agregar a Google Wallet"</li>
                  <li>Inicia sesión con tu cuenta de Google (si es necesario)</li>
                  <li>Confirma para guardar la tarjeta</li>
                  <li>¡Listo! Tu tarjeta estará disponible en Google Wallet</li>
                </ol>
              </div>
              
              <div class="divider"></div>
              
              <p style="color: #666; font-size: 14px;">
                <strong>¿Necesitas ayuda?</strong><br>
                Si tienes problemas para agregar tu tarjeta o cualquier otra consulta, no dudes en contactarnos.
              </p>
            </div>
            
            <div class="footer">
              <p class="company">${companyName}</p>
              <p>© ${new Date().getFullYear()} Todos los derechos reservados</p>
              <p style="font-size: 12px; color: #999;">
                Este es un correo automático. Por favor, no respondas a este mensaje.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Google Wallet card email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending Google Wallet card email:", error);
    // Don't throw error to not interrupt the main flow
    return { success: false, error: error.message };
  }
};