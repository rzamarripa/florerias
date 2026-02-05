interface SendWhatsAppMessageParams {
  phoneNumber: string; // Número con código de país, sin + ni espacios
  message: string;
  ticketUrl?: string;
  ticketType?: 'sale' | 'delivery';
}

interface WhatsAppResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  details?: any;
}

/**
 * Formatea un número de teléfono para WhatsApp
 * Remueve espacios, guiones, paréntesis y el símbolo +
 */
export const formatPhoneNumberForWhatsApp = (phoneNumber: string): string => {
  // Remover todos los caracteres no numéricos
  return phoneNumber.replace(/[^0-9]/g, '');
};

/**
 * Valida si un número de teléfono tiene formato válido para WhatsApp
 */
export const isValidWhatsAppNumber = (phoneNumber: string): boolean => {
  const cleaned = formatPhoneNumberForWhatsApp(phoneNumber);
  // Debe tener entre 10 y 15 dígitos
  return cleaned.length >= 10 && cleaned.length <= 15;
};

/**
 * Envía un mensaje de WhatsApp con el ticket de venta
 */
export const sendTicketViaWhatsApp = async ({
  phoneNumber,
  message,
  ticketUrl,
  ticketType = 'sale'
}: SendWhatsAppMessageParams): Promise<WhatsAppResponse> => {
  try {
    console.log('🚀 WhatsApp Service - INICIO DE ENVÍO');
    console.log('📥 Input recibido:', {
      phoneNumber: phoneNumber,
      phoneNumberLength: phoneNumber.length,
      ticketType: ticketType,
      hasTicketUrl: !!ticketUrl,
      ticketUrlPreview: ticketUrl ? ticketUrl.substring(0, 50) + '...' : null
    });
    
    // Formatear el número
    const formattedNumber = formatPhoneNumberForWhatsApp(phoneNumber);
    console.log('📱 Número formateado:', {
      original: phoneNumber,
      formatted: formattedNumber,
      length: formattedNumber.length,
      esperadoParaMexico: '52 + 10 dígitos = ' + (formattedNumber.startsWith('52') ? formattedNumber.length - 2 : 'N/A') + ' dígitos'
    });

    // Validar el número
    if (!isValidWhatsAppNumber(formattedNumber)) {
      console.error('❌ Número inválido:', formattedNumber);
      throw new Error('Número de teléfono inválido');
    }

    // Determinar el nombre del archivo según el tipo de ticket
    const documentFilename = ticketType === 'sale' ? 'ticket_venta.html' : 'ticket_envio.html';

    // Preparar el cuerpo de la petición
    const body = {
      to: formattedNumber,
      message,
      ...(ticketUrl && { 
        documentUrl: ticketUrl,
        documentFilename
      })
    };
    
    console.log('📤 Request body preparado para API route:', {
      to: body.to,
      toFormat: `Formato: ${body.to.startsWith('52') ? 'México' : 'Otro'} - Longitud: ${body.to.length}`,
      hasMessage: !!body.message,
      messagePreview: body.message ? body.message.substring(0, 50) + '...' : null,
      hasDocument: !!ticketUrl,
      documentFilename
    });

    // Hacer la petición al API route
    const response = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('📨 WhatsApp Service - Respuesta de API route:', {
      ok: response.ok,
      status: response.status,
      success: data.success,
      messageId: data.data?.messages?.[0]?.id || null,
      phoneNumber: data.phoneNumber,
      error: data.error
    });

    if (!response.ok) {
      console.error('❌ WhatsApp Service - Error completo:', {
        status: response.status,
        error: data.error,
        details: data.details,
        phoneNumber: data.phoneNumber,
        originalInput: data.originalInput
      });
      
      // Return the error details for better user feedback
      return {
        success: false,
        error: data.error || 'Error al enviar mensaje de WhatsApp',
        details: data.details
      };
    }

    console.log('✅ WhatsApp Service - ENVÍO EXITOSO:', {
      messageId: data.data?.messages?.[0]?.id,
      phoneNumber: data.phoneNumber
    });

    return data;
  } catch (error: any) {
    console.error('💥 Error en servicio de WhatsApp:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar mensaje de WhatsApp',
    };
  }
};

/**
 * Genera el mensaje de confirmación para el ticket
 */
export const generateTicketMessage = (
  orderNumber: string,
  clientName: string,
  ticketType: 'sale' | 'delivery' = 'sale'
): string => {
  if (ticketType === 'sale') {
    return `Hola ${clientName}! 🌸

Tu orden #${orderNumber} ha sido confirmada exitosamente.

Te adjuntamos tu ticket de compra. ¡Gracias por tu preferencia!

Corazón Violeta 💜`;
  } else {
    return `Hola ${clientName}! 🌸

Tu orden de envío #${orderNumber} está lista.

Te adjuntamos el ticket con los detalles de entrega.

Corazón Violeta 💜`;
  }
};