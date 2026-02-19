interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded content
  type?: string;
}

interface EmailResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  details?: any;
}

/**
 * Valida si un email tiene formato válido
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Genera el HTML del mensaje de confirmación para el email
 */
export const generateOrderEmailHTML = (
  orderNumber: string,
  clientName: string,
  ticketType: 'sale' | 'delivery' = 'sale'
): string => {
  const baseStyles = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    border-radius: 15px;
  `;

  const containerStyles = `
    background: white;
    border-radius: 10px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  `;

  const headerStyles = `
    color: #764ba2;
    font-size: 28px;
    margin-bottom: 20px;
    text-align: center;
    font-weight: bold;
  `;

  const contentStyles = `
    color: #333;
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 15px;
  `;

  const orderNumberStyles = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    display: inline-block;
    font-weight: bold;
    font-size: 18px;
    margin: 20px 0;
  `;

  const footerStyles = `
    margin-top: 30px;
    padding-top: 20px;
    border-top: 2px solid #f0f0f0;
    text-align: center;
    color: #666;
    font-size: 14px;
  `;

  const logoStyles = `
    text-align: center;
    margin-bottom: 20px;
    font-size: 24px;
    color: #764ba2;
  `;

  if (ticketType === 'sale') {
    return `
      <div style="${baseStyles}">
        <div style="${containerStyles}">
          <div style="${logoStyles}">
            🌸 Zolt Florería 🌸
          </div>
          <h2 style="${headerStyles}">¡Gracias por tu compra, ${clientName}!</h2>
          
          <div style="${contentStyles}">
            <p>Tu orden ha sido confirmada exitosamente.</p>
            
            <div style="text-align: center;">
              <div style="${orderNumberStyles}">
                Orden #${orderNumber}
              </div>
            </div>
            
            <p>Hemos recibido tu pedido y lo estamos preparando con mucho cariño.</p>
            
            <p><strong>¿Qué sigue?</strong></p>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0;">✅ Tu orden está siendo procesada</li>
              <li style="padding: 8px 0;">🌺 Preparamos tu arreglo con las flores más frescas</li>
              <li style="padding: 8px 0;">📦 Te notificaremos cuando esté listo</li>
            </ul>
          </div>
          
          <div style="${footerStyles}">
            <p><strong>Zolt Florería</strong> 💜</p>
            <p style="font-size: 12px; color: #999;">
              Este es un correo automático, por favor no respondas a este mensaje.
            </p>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div style="${baseStyles}">
        <div style="${containerStyles}">
          <div style="${logoStyles}">
            🚚 Zolt Florería - Envío 🚚
          </div>
          <h2 style="${headerStyles}">Orden de envío lista, ${clientName}</h2>
          
          <div style="${contentStyles}">
            <p>Tu orden de envío está lista para ser entregada.</p>
            
            <div style="text-align: center;">
              <div style="${orderNumberStyles}">
                Orden de Envío #${orderNumber}
              </div>
            </div>
            
            <p>Los detalles de entrega han sido confirmados y nuestro repartidor está en camino.</p>
            
            <p><strong>Información importante:</strong></p>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0;">🚚 El repartidor está en camino</li>
              <li style="padding: 8px 0;">📱 Te contactaremos al acercarse</li>
              <li style="padding: 8px 0;">💐 Tu arreglo llegará fresco y hermoso</li>
            </ul>
          </div>
          
          <div style="${footerStyles}">
            <p><strong>Zolt Florería</strong> 💜</p>
            <p style="font-size: 12px; color: #999;">
              Este es un correo automático, por favor no respondas a este mensaje.
            </p>
          </div>
        </div>
      </div>
    `;
  }
};

/**
 * Genera el texto plano del mensaje para el email (alternativa al HTML)
 */
export const generateOrderEmailText = (
  orderNumber: string,
  clientName: string,
  ticketType: 'sale' | 'delivery' = 'sale'
): string => {
  if (ticketType === 'sale') {
    return `Hola ${clientName}! 🌸

Tu orden #${orderNumber} ha sido confirmada exitosamente.

Hemos recibido tu pedido y lo estamos preparando con mucho cariño.

¿Qué sigue?
- Tu orden está siendo procesada
- Preparamos tu arreglo con las flores más frescas
- Te notificaremos cuando esté listo

¡Gracias por tu preferencia!

Zolt Florería 💜`;
  } else {
    return `Hola ${clientName}! 🚚

Tu orden de envío #${orderNumber} está lista.

Los detalles de entrega han sido confirmados y nuestro repartidor está en camino.

Información importante:
- El repartidor está en camino
- Te contactaremos al acercarse
- Tu arreglo llegará fresco y hermoso

Zolt Florería 💜`;
  }
};

/**
 * Descarga una imagen desde URL y la convierte a Base64
 */
const downloadImageAsBase64 = async (imageUrl: string): Promise<string> => {
  try {
    console.log('📥 Descargando imagen desde:', imageUrl);
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('📁 Imagen descargada, tamaño:', blob.size, 'bytes');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remover el prefijo data:image/...;base64,
        const base64Content = base64.split(',')[1];
        console.log('🔄 Imagen convertida a Base64, tamaño:', base64Content.length, 'caracteres');
        resolve(base64Content);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('❌ Error descargando imagen:', error);
    throw error;
  }
};

/**
 * Envía un email de confirmación de orden
 */
export const sendOrderEmail = async ({
  to,
  orderNumber,
  clientName,
  ticketType = 'sale',
  ticketImageUrl
}: {
  to: string;
  orderNumber: string;
  clientName: string;
  ticketType?: 'sale' | 'delivery';
  ticketImageUrl?: string;
}): Promise<EmailResponse> => {
  try {
    console.log('🚀 Email Service - Iniciando envío de email');
    console.log('📧 Destinatario:', to);
    console.log('📋 Orden:', orderNumber);
    console.log('👤 Cliente:', clientName);
    console.log('🎫 Tipo:', ticketType);

    // Validar email
    if (!isValidEmail(to)) {
      console.error('❌ Email inválido:', to);
      throw new Error('Dirección de email inválida');
    }

    // Generar el contenido del email
    const subject = ticketType === 'sale' 
      ? `✨ Confirmación de tu orden #${orderNumber} - Zolt Florería`
      : `🚚 Tu envío #${orderNumber} está en camino - Zolt Florería`;
    
    const html = generateOrderEmailHTML(orderNumber, clientName, ticketType);
    const text = generateOrderEmailText(orderNumber, clientName, ticketType);

    // Preparar attachments si hay imagen o HTML del ticket
    let attachments: EmailAttachment[] | undefined;
    
    if (ticketImageUrl) {
      try {
        // Detectar si es HTML o imagen
        const isHtml = ticketImageUrl.includes('.html');
        
        if (isHtml) {
          console.log('📄 Procesando HTML del ticket...');
          // Descargar el HTML y adjuntarlo
          const response = await fetch(ticketImageUrl);
          const htmlContent = await response.text();
          
          // Convertir a base64
          const base64Content = btoa(unescape(encodeURIComponent(htmlContent)));
          
          attachments = [{
            filename: `ticket_${orderNumber}.html`,
            content: base64Content,
            type: 'text/html'
          }];
          
          console.log('✅ HTML del ticket preparado como attachment');
        } else {
          console.log('🖼️ Procesando imagen del ticket...');
          const base64Content = await downloadImageAsBase64(ticketImageUrl);
          
          attachments = [{
            filename: `ticket_${orderNumber}.png`,
            content: base64Content,
            type: 'image/png'
          }];
          
          console.log('✅ Imagen del ticket preparada como attachment');
        }
      } catch (error) {
        console.error('⚠️ Error procesando ticket:', error);
        // Continuar sin attachment en caso de error
        console.log('📧 Continuando envío sin archivo adjunto');
      }
    }

    // Preparar el cuerpo de la petición
    const body = {
      to,
      subject,
      html,
      text,
      ...(attachments && { attachments })
    };

    console.log('📤 Email Service - Enviando petición al API route');

    // Hacer la petición al API route
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    console.log('📨 Email Service - Respuesta del API route:', {
      ok: response.ok,
      status: response.status,
      success: data.success,
      id: data.data?.id
    });

    if (!response.ok) {
      console.error('❌ Email Service - Error completo:', {
        status: response.status,
        error: data.error,
        details: data.details
      });
      
      return {
        success: false,
        error: data.error || 'Error al enviar el email',
        details: data.details
      };
    }

    console.log('✅ Email Service - Email enviado exitosamente:', {
      id: data.data?.id,
      to
    });

    return {
      success: true,
      data: data.data,
      message: 'Email enviado exitosamente'
    };

  } catch (error: any) {
    console.error('💥 Error en servicio de Email:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar el email',
    };
  }
};

/**
 * Envía un email con la tarjeta de Google Wallet
 */
export const sendGoogleWalletCard = async ({
  to,
  clientName,
  clientNumber,
  points,
  saveUrl,
  companyName = 'Zolt'
}: {
  to: string;
  clientName: string;
  clientNumber: string;
  points: number;
  saveUrl: string;
  companyName?: string;
}): Promise<EmailResponse> => {
  try {
    console.log('📧 Enviando Google Wallet Card por email:', {
      to,
      clientName,
      clientNumber,
      points,
      saveUrl: saveUrl.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });

    // Validar email
    if (!isValidEmail(to)) {
      console.error('❌ Email inválido para Google Wallet:', to);
      return {
        success: false,
        error: `Email inválido: ${to}`,
        message: 'El formato del email no es válido'
      };
    }

    const subject = `Tu Tarjeta Digital está Lista - ${companyName}`;

    const html = `
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
          }
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
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
            <p style="font-size: 16px;">Hola <strong>${clientName}</strong>,</p>
            
            <p>Tu tarjeta de fidelidad digital ha sido creada exitosamente.</p>
            
            <div class="card-preview">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 18px; font-weight: bold;">${companyName}</div>
                <div style="font-size: 12px; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 12px;">
                  TARJETA DIGITAL
                </div>
              </div>
              <div style="margin: 20px 0;">
                <p style="margin: 5px 0;">Número de Cliente: <strong>${clientNumber}</strong></p>
                <p style="margin: 5px 0;">Puntos Actuales: <strong>${points}</strong></p>
              </div>
            </div>
            
            <a href="${saveUrl}" class="wallet-button" style="color: white;">
              📱 Agregar a Google Wallet
            </a>
            
            <p style="text-align: center; color: #666; font-size: 14px;">
              Haz clic en el botón para agregar tu tarjeta a Google Wallet
            </p>
          </div>
          
          <div class="footer">
            <p style="color: #6c757d; font-size: 14px;">
              © ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error enviando Google Wallet email:', {
        status: response.status,
        error: data.error,
        details: data.details,
        to
      });
      return {
        success: false,
        error: data.error || 'Error al enviar el email',
        details: data.details
      };
    }

    console.log('✅ Google Wallet Card enviada por email:', {
      id: data.data?.id,
      to,
      timestamp: new Date().toISOString()
    });
    return {
      success: true,
      data: data.data,
      message: 'Email enviado exitosamente'
    };
  } catch (error: any) {
    console.error('Error enviando Google Wallet Card:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar el email',
    };
  }
};

/**
 * Envía un email con la tarjeta de Apple Wallet
 */
export const sendAppleWalletCard = async ({
  to,
  clientName,
  clientNumber,
  points,
  downloadUrl,
  companyName = 'Zolt'
}: {
  to: string;
  clientName: string;
  clientNumber: string;
  points: number;
  downloadUrl: string;
  companyName?: string;
}): Promise<EmailResponse> => {
  try {
    console.log('📧 Enviando Apple Wallet Card por email:', {
      to,
      clientName,
      clientNumber,
      points,
      downloadUrl,
      timestamp: new Date().toISOString()
    });

    // Validar email
    if (!isValidEmail(to)) {
      console.error('❌ Email inválido para Apple Wallet:', to);
      return {
        success: false,
        error: `Email inválido: ${to}`,
        message: 'El formato del email no es válido'
      };
    }

    const subject = `Tu Tarjeta Digital Apple Wallet - ${companyName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            background: linear-gradient(135deg, #000 0%, #333 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .wallet-info {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
          }
          .download-button {
            display: inline-block;
            background: linear-gradient(135deg, #000 0%, #333 100%);
            color: white;
            padding: 15px 40px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 18px;
          }
          .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍎 Tu Tarjeta Apple Wallet</h1>
            <p>¡${clientName}, tu tarjeta digital está lista!</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">Hola <strong>${clientName}</strong>,</p>
            
            <p>Te enviamos tu tarjeta de fidelidad para Apple Wallet.</p>
            
            <div class="wallet-info">
              <h3>📱 Información de tu tarjeta:</h3>
              <p><strong>Número de cliente:</strong> ${clientNumber}</p>
              <p><strong>Puntos actuales:</strong> ${points}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${downloadUrl}?email=sent" class="download-button">
                🍎 Descargar para Apple Wallet
              </a>
            </div>

            <p style="text-align: center; padding: 15px; background: #f0f0f0; border-radius: 8px;">
              <strong>⚠️ Importante:</strong> Este archivo solo funciona en dispositivos Apple (iPhone, Apple Watch)
            </p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error enviando Apple Wallet email:', {
        status: response.status,
        error: data.error,
        details: data.details,
        to
      });
      return {
        success: false,
        error: data.error || 'Error al enviar el email',
        details: data.details
      };
    }

    console.log('✅ Apple Wallet Card enviada por email:', {
      id: data.data?.id,
      to,
      timestamp: new Date().toISOString()
    });
    return {
      success: true,
      data: data.data,
      message: 'Email enviado exitosamente'
    };
  } catch (error: any) {
    console.error('Error enviando Apple Wallet Card:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar el email',
    };
  }
};

/**
 * Envía un email personalizado (para uso futuro con contenido customizado)
 */
export const sendCustomEmail = async ({
  to,
  subject,
  html,
  text,
  replyTo,
  attachments
}: SendEmailParams): Promise<EmailResponse> => {
  try {
    console.log('📧 Email Service - Enviando email personalizado');

    // Validar emails
    const recipients = Array.isArray(to) ? to : [to];
    for (const email of recipients) {
      if (!isValidEmail(email)) {
        throw new Error(`Email inválido: ${email}`);
      }
    }

    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
        replyTo,
        ...(attachments && { attachments })
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Error al enviar el email',
        details: data.details
      };
    }

    return {
      success: true,
      data: data.data,
      message: 'Email enviado exitosamente'
    };

  } catch (error: any) {
    console.error('💥 Error en servicio de Email:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar el email',
    };
  }
};

/**
 * Envía un email con el código de recuperación de contraseña
 */
export const sendPasswordResetCode = async ({
  to,
  code,
  userName = 'Usuario',
  companyName = 'Zolt'
}: {
  to: string;
  code: string;
  userName?: string;
  companyName?: string;
}): Promise<EmailResponse> => {
  try {
    console.log('📧 Enviando código de recuperación de contraseña:', {
      to,
      userName
    });

    // Validar email
    if (!isValidEmail(to)) {
      throw new Error('Dirección de email inválida');
    }

    const subject = `Código de recuperación de contraseña - ${companyName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          .content {
            padding: 40px 30px;
          }
          .code-box {
            background: #f8f9fa;
            border: 2px solid #667eea;
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .code-info {
            color: #666;
            font-size: 14px;
            margin-top: 15px;
          }
          .warning-box {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin: 25px 0;
            color: #856404;
          }
          .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            color: #666;
            font-size: 14px;
          }
          .security-list {
            background: #e8f4f8;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .security-list ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .security-list li {
            margin: 8px 0;
            color: #495057;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">Hola <strong>${userName}</strong>,</p>
            
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Utiliza el siguiente código para continuar con el proceso:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
              <div class="code-info">Este código expira en 10 minutos</div>
            </div>

            <div class="warning-box">
              <strong>⚠️ Si no solicitaste este código</strong><br>
              Puedes ignorar este correo de manera segura. Tu contraseña no será cambiada sin tu confirmación.
            </div>

            <div class="security-list">
              <strong>🛡️ Por tu seguridad:</strong>
              <ul>
                <li>No compartas este código con nadie</li>
                <li>Nuestro equipo nunca te pedirá este código</li>
                <li>El código solo es válido por 10 minutos</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.</p>
            <p style="font-size: 12px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Error al enviar el email',
      };
    }

    console.log('✅ Código de recuperación enviado por email');
    return {
      success: true,
      data: data.data,
      message: 'Email enviado exitosamente'
    };
  } catch (error: any) {
    console.error('Error enviando código de recuperación:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar el email',
    };
  }
};

/**
 * Envía un email de confirmación de cambio de contraseña
 */
export const sendPasswordChangeConfirmation = async ({
  to,
  userName = 'Usuario',
  companyName = 'Zolt'
}: {
  to: string;
  userName?: string;
  companyName?: string;
}): Promise<EmailResponse> => {
  try {
    console.log('📧 Enviando confirmación de cambio de contraseña:', {
      to,
      userName
    });

    // Validar email
    if (!isValidEmail(to)) {
      throw new Error('Dirección de email inválida');
    }

    const subject = `Contraseña actualizada exitosamente - ${companyName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .success-icon {
            font-size: 48px;
            margin: 10px 0;
          }
          .content {
            padding: 40px 30px;
          }
          .info-box {
            background: #d4edda;
            border: 1px solid #28a745;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .info-box strong {
            color: #155724;
          }
          .alert-box {
            background: #f8d7da;
            border: 1px solid #dc3545;
            border-radius: 8px;
            padding: 15px;
            margin: 25px 0;
            color: #721c24;
          }
          .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            color: #666;
            font-size: 14px;
          }
          .timestamp {
            color: #6c757d;
            font-size: 14px;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Contraseña Actualizada</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">Hola <strong>${userName}</strong>,</p>
            
            <div class="info-box">
              <strong>Tu contraseña ha sido actualizada exitosamente.</strong>
              <div class="timestamp">
                Fecha y hora: ${new Date().toLocaleString('es-MX', { 
                  timeZone: 'America/Mexico_City',
                  dateStyle: 'full',
                  timeStyle: 'medium'
                })}
              </div>
            </div>

            <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>

            <div class="alert-box">
              <strong>⚠️ ¿No reconoces esta actividad?</strong><br>
              Si no realizaste este cambio, por favor contacta inmediatamente a nuestro equipo de soporte 
              y cambia tu contraseña lo antes posible.
            </div>

            <p style="color: #666; font-size: 14px;">
              <strong>Consejos de seguridad:</strong><br>
              • Usa contraseñas únicas para cada cuenta<br>
              • No compartas tu contraseña con nadie<br>
              • Cambia tu contraseña periódicamente<br>
              • Activa la autenticación de dos factores si está disponible
            </p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.</p>
            <p style="font-size: 12px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Error al enviar el email',
      };
    }

    console.log('✅ Confirmación de cambio de contraseña enviada');
    return {
      success: true,
      data: data.data,
      message: 'Email enviado exitosamente'
    };
  } catch (error: any) {
    console.error('Error enviando confirmación:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar el email',
    };
  }
};