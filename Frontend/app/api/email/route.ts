import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Log de verificación de credenciales
console.log('📧 Email API Route - Verificación de credenciales:', {
  hasApiKey: !!process.env.RESEND_API_KEY,
  apiKeyPreview: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) + '...' : 'NO KEY',
});

export async function POST(req: NextRequest) {
  try {
    // Verificar que la API key esté configurada
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ Resend API key no está configurada');
      return NextResponse.json(
        { error: 'Servicio de email no configurado correctamente' },
        { status: 503 }
      );
    }

    const { to, subject, html, text, replyTo, attachments } = await req.json();

    console.log('📨 Email API Route - Request recibido:', {
      timestamp: new Date().toISOString(),
      to,
      subject,
      hasHtml: !!html,
      hasText: !!text,
      replyTo,
      hasAttachments: !!attachments,
      attachmentsCount: attachments?.length || 0
    });

    // Validar campos requeridos
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { 
          error: 'Faltan campos requeridos',
          details: {
            to: !!to,
            subject: !!subject,
            content: !!(html || text)
          }
        },
        { status: 400 }
      );
    }

    // Preparar attachments si existen
    const resendAttachments = attachments?.map((attachment: any) => ({
      filename: attachment.filename,
      content: attachment.content, // Base64 content
      type: attachment.type || 'application/octet-stream'
    }));

    // Enviar email usando Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Zolt Florería <onboarding@resend.dev>', // Usar EMAIL_FROM si está configurado
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || undefined,
      text: text || undefined,
      reply_to: replyTo || undefined,
      attachments: resendAttachments || undefined,
    });

    if (error) {
      console.error('❌ Email API Route - Error de Resend:', {
        error,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          error: 'Error al enviar el email',
          details: error
        },
        { status: 500 }
      );
    }

    console.log('✅ Email API Route - Email enviado exitosamente:', {
      id: data?.id,
      to,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data,
      message: 'Email enviado exitosamente'
    });

  } catch (error: any) {
    console.error('💥 Error en Email API Route:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor',
        details: error
      },
      { status: 500 }
    );
  }
}