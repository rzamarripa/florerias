import { NextRequest, NextResponse } from 'next/server';

const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;

// Log de verificación de credenciales al iniciar
console.log('🔑 WhatsApp API Route - Verificación de credenciales:', {
  hasPhoneId: !!WA_PHONE_NUMBER_ID,
  phoneNumberId: WA_PHONE_NUMBER_ID,
  hasToken: !!WA_ACCESS_TOKEN,
  tokenPreview: WA_ACCESS_TOKEN ? WA_ACCESS_TOKEN.substring(0, 20) + '...' : 'NO TOKEN',
  tokenLength: WA_ACCESS_TOKEN ? WA_ACCESS_TOKEN.length : 0
});

if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
  console.error('❌ WhatsApp credentials missing!')
}

const API = `https://graph.facebook.com/v22.0/${WA_PHONE_NUMBER_ID}/messages`;

export async function POST(req: NextRequest) {
  try {
    // Check if credentials are available
    if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
      console.error('WhatsApp API credentials are not configured');
      return NextResponse.json(
        { error: 'WhatsApp servicio no configurado correctamente' },
        { status: 503 }
      );
    }

    const { to, message, imageUrl, documentUrl, documentFilename, useTemplate } = await req.json();
    
    // Limpiar y validar el número de teléfono
    let phoneNumber = to.toString().replace(/[^0-9]/g, ''); // Remover cualquier carácter no numérico
    
    console.log('📞 WhatsApp API Route - Request recibido:', {
      timestamp: new Date().toISOString(),
      originalTo: to,
      cleanedNumber: phoneNumber,
      numberLength: phoneNumber.length,
      expectedFormatMX: phoneNumber.startsWith('52') ? '52 + 10 dígitos (sin el 1)' : 'N/A',
      hasMessage: !!message,
      hasDocument: !!documentUrl,
      documentFilename,
      apiUrl: API
    });

    // Validar número de teléfono (debe tener entre 10 y 15 dígitos)
    if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
      return NextResponse.json(
        { 
          error: 'Número de teléfono inválido. Debe incluir código de país sin + ni espacios.',
          details: {
            received: to,
            cleaned: phoneNumber,
            length: phoneNumber.length,
            expected: '10-15 dígitos con código de país'
          }
        },
        { status: 400 }
      );
    }

    // Construir el cuerpo del mensaje según el tipo
    let body: any = {
      messaging_product: 'whatsapp',
      to: phoneNumber, // Usar el número limpio
      recipient_type: 'individual'
    };

    // Si se especifica usar template (para sandbox)
    if (useTemplate) {
      body = {
        ...body,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
          }
        }
      };
    } else if (documentUrl) {
      // Enviar documento HTML como archivo
      body = {
        ...body,
        type: 'document',
        document: {
          link: documentUrl,
          filename: documentFilename || 'ticket.html',
          caption: message || ''
        }
      };
    } else if (imageUrl) {
      // Enviar imagen
      body = {
        ...body,
        type: 'image',
        image: {
          link: imageUrl,
          caption: message || ''
        }
      };
    } else {
      // Enviar solo texto
      body = {
        ...body,
        type: 'text',
        text: {
          body: message
        }
      };
    }

    console.log('🚀 WhatsApp API Route - Enviando a Meta:', {
      to: phoneNumber,
      apiUrl: API,
      bodyType: documentUrl ? 'document' : (imageUrl ? 'image' : 'text'),
      fullBody: JSON.stringify(body, null, 2)
    });
    
    // Hacer la petición a la API de WhatsApp
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    console.log('📥 WhatsApp API Route - Respuesta de Meta:', {
      status: res.status,
      ok: res.ok,
      messageId: data.messages?.[0]?.id || null,
      error: data.error || null
    });

    if (!res.ok) {
      console.error('❌ WhatsApp API Route - Error de Meta:', {
        status: res.status,
        statusText: res.statusText,
        errorCode: data.error?.code,
        errorMessage: data.error?.message,
        fullError: data
      });
      
      // Check for specific error types
      let errorMessage = data.error?.message || data.error?.error_data?.details || 'Error al enviar mensaje de WhatsApp';
      
      // Handle specific error codes
      if (data.error?.code === 131030) {
        errorMessage = `El número ${phoneNumber} no está en la lista de permitidos. Para usar WhatsApp en modo desarrollo, agrega este número exacto en Meta Business Suite > WhatsApp > Configuración > Números de teléfono permitidos.`;
      } else if (data.error?.code === 131056) {
        errorMessage = 'El formato del número de teléfono es inválido. Asegúrate de incluir el código de país sin el símbolo +';
      } else if (data.error?.code === 131021) {
        errorMessage = 'El número de WhatsApp Business no está configurado correctamente.';
      } else if (data.error?.code === 131047) {
        errorMessage = 'El número de teléfono no tiene WhatsApp o no está registrado.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: data,
          phoneNumber: phoneNumber,
          originalInput: to
        },
        { status: res.status }
      );
    }

    console.log('✅ WhatsApp API Route - Mensaje enviado exitosamente:', {
      messageId: data.messages?.[0]?.id,
      to: phoneNumber,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: true,
      data,
      message: 'Mensaje enviado exitosamente',
      phoneNumber: phoneNumber
    });
  } catch (error: any) {
    console.error('Error en WhatsApp API Route:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}