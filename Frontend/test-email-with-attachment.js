// Test script para probar el servicio de email con imagen adjunta
const testEmailWithAttachment = async () => {
  console.log('🧪 Iniciando prueba del servicio de email con imagen adjunta...\n');
  
  // URL de ejemplo de una imagen (usaremos una imagen de prueba)
  // En el escenario real, esto sería la URL de Firebase Storage del ticket
  const testImageUrl = 'https://via.placeholder.com/600x800/667eea/FFFFFF?text=TICKET+DE+PRUEBA';
  
  // Configuración de la prueba
  const testData = {
    to: 'test@example.com', // Cambiar a tu email para probar
    orderNumber: 'TEST-001',
    clientName: 'Cliente de Prueba',
    ticketType: 'sale',
    ticketImageUrl: testImageUrl
  };

  try {
    console.log('📧 Enviando email con los siguientes datos:');
    console.log('- Destinatario:', testData.to);
    console.log('- Orden:', testData.orderNumber);
    console.log('- Cliente:', testData.clientName);
    console.log('- URL de imagen:', testData.ticketImageUrl);
    console.log('');

    // Hacer petición al servicio de email
    const response = await fetch('http://localhost:3001/services/emailService', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Email con imagen adjunta enviado exitosamente!');
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

// Función alternativa para probar directamente el API route
const testEmailApiRoute = async () => {
  console.log('🧪 Probando directamente el API route...\n');
  
  // Crear un attachment de prueba (imagen base64 pequeña)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  const testData = {
    to: 'test@example.com',
    subject: '🧪 Prueba de Email con Imagen Adjunta - Zolt Florería',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #764ba2;">🌸 Zolt Florería</h2>
        <p>Este es un email de prueba con imagen adjunta.</p>
        <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Orden de prueba:</strong> TEST-002</p>
          <p><strong>Cliente:</strong> Cliente de Prueba</p>
          <p><strong>Estado:</strong> ✅ Confirmada</p>
        </div>
        <p>La imagen del ticket se encuentra adjunta en este correo.</p>
        <p style="color: #999; font-size: 12px;">Zolt Florería 💜</p>
      </div>
    `,
    attachments: [{
      filename: 'ticket_TEST-002.png',
      content: testImageBase64,
      type: 'image/png'
    }]
  };

  try {
    console.log('📤 Enviando petición al API route...');
    
    const response = await fetch('http://localhost:3001/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Email con attachment enviado exitosamente!');
      console.log('📧 ID del mensaje:', result.data?.id);
      console.log('\nRespuesta completa:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Error al enviar el email:');
      console.error('Status:', response.status);
      console.error('Error:', result.error);
      console.error('Detalles:', result.details);
    }
  } catch (error) {
    console.error('💥 Error en la petición:', error.message);
  }
};

// Función principal
const main = async () => {
  console.log('='.repeat(60));
  console.log('🧪 PRUEBA DE EMAIL CON IMAGEN ADJUNTA');
  console.log('='.repeat(60));
  console.log('');
  
  // Cambiar a true para probar el API route directamente
  const testApiRoute = false;
  
  if (testApiRoute) {
    await testEmailApiRoute();
  } else {
    console.log('⚠️  Nota: Esta prueba requiere que el servidor esté ejecutándose');
    console.log('⚠️  Ejecuta primero: npm run dev');
    console.log('');
    await testEmailWithAttachment();
  }
};

// Ejecutar la prueba
main();