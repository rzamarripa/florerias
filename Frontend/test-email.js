// Test script para probar el servicio de email
const testEmailService = async () => {
  console.log('🧪 Iniciando prueba del servicio de email...\n');
  
  // Configuración de la prueba
  const testData = {
    to: 'test@example.com', // Cambiar a cualquier email válido para probar (dominio verificado)
    subject: '✨ Prueba de Confirmación de Orden - Zolt Florería',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 8px;">
            <h1 style="color: #764ba2; text-align: center;">🌸 Zolt Florería 🌸</h1>
            <h2 style="color: #333;">¡Prueba de Email Exitosa!</h2>
            <p style="color: #666; line-height: 1.6;">
              Este es un email de prueba para verificar que el servicio de Resend está funcionando correctamente.
            </p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Orden de prueba:</strong> #TEST-001</p>
              <p style="margin: 0;"><strong>Cliente:</strong> Cliente de Prueba</p>
              <p style="margin: 0;"><strong>Estado:</strong> ✅ Confirmada</p>
            </div>
            <hr style="border: 1px solid #eee; margin: 30px 0;">
            <p style="text-align: center; color: #999; font-size: 14px;">
              <strong>Zolt Florería</strong> 💜<br>
              Este es un correo de prueba automático
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Zolt Florería - Prueba de Email

¡Prueba de Email Exitosa!

Este es un email de prueba para verificar que el servicio de Resend está funcionando correctamente.

Orden de prueba: #TEST-001
Cliente: Cliente de Prueba
Estado: Confirmada

Zolt Florería 💜
    `
  };

  try {
    // Hacer petición al API route
    const response = await fetch('http://localhost:3001/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Email enviado exitosamente!');
      console.log('📧 ID del mensaje:', result.data?.id);
      console.log('\nRespuesta completa:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Error al enviar el email:');
      console.error('Error:', result.error);
      console.error('Detalles:', result.details);
    }
  } catch (error) {
    console.error('💥 Error en la petición:', error.message);
  }
};

// Ejecutar la prueba
testEmailService();