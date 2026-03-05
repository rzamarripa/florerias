import { NextRequest, NextResponse } from 'next/server';

const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;

if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
  console.error('WhatsApp credentials missing!');
}

const API = `https://graph.facebook.com/v22.0/${WA_PHONE_NUMBER_ID}/messages`;

export async function POST(req: NextRequest) {
  try {
    if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'WhatsApp servicio no configurado correctamente' },
        { status: 503 }
      );
    }

    const { to, message, imageUrl, documentUrl, documentFilename } = await req.json();

    // Limpiar y validar el número de teléfono
    let phoneNumber = to.toString().replace(/[^0-9]/g, '');

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
      to: phoneNumber,
      recipient_type: 'individual'
    };

    if (documentUrl) {
      // Enviar como imagen (los tickets son imágenes PNG)
      body = {
        ...body,
        type: 'image',
        image: {
          link: documentUrl,
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

    if (!res.ok) {
      console.error('WhatsApp API error:', {
        status: res.status,
        errorCode: data.error?.code,
        errorMessage: data.error?.message,
      });

      let errorMessage = data.error?.message || data.error?.error_data?.details || 'Error al enviar mensaje de WhatsApp';

      if (data.error?.code === 131030) {
        errorMessage = `No se pudo enviar el mensaje al número ${phoneNumber}. Verifica que el número sea correcto y tenga WhatsApp activo.`;
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
