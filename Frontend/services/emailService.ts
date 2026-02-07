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

    // Preparar attachments si hay imagen del ticket
    let attachments: EmailAttachment[] | undefined;
    
    if (ticketImageUrl) {
      try {
        console.log('🖼️ Procesando imagen del ticket...');
        const base64Content = await downloadImageAsBase64(ticketImageUrl);
        
        attachments = [{
          filename: `ticket_${orderNumber}.png`,
          content: base64Content,
          type: 'image/png'
        }];
        
        console.log('✅ Imagen del ticket preparada como attachment');
      } catch (error) {
        console.error('⚠️ Error procesando imagen del ticket:', error);
        // Continuar sin attachment en caso de error
        console.log('📧 Continuando envío sin imagen adjunta');
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