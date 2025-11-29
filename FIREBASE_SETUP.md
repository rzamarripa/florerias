# Configuración de Firebase Storage

Este documento describe cómo configurar Firebase Storage para guardar los archivos de comprobantes y arreglos de las órdenes.

## Pasos para configurar Firebase Storage

### 1. Acceder a la Consola de Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **maflores-5c6c5**

### 2. Habilitar Firebase Storage
1. En el menú lateral izquierdo, haz clic en **"Build"** → **"Storage"**
2. Si no has configurado Storage, haz clic en **"Get Started"**
3. Aparecerá un modal con las reglas de seguridad. Por ahora, selecciona **"Start in test mode"** (cambiaremos las reglas después)
4. Selecciona la ubicación de tu bucket (recomendado: **us-central1** o la más cercana a tu región)
5. Haz clic en **"Done"**

### 3. Configurar Reglas de Seguridad

Por defecto, Firebase Storage en modo de prueba permite lectura y escritura sin autenticación durante 30 días. Para producción, necesitas configurar reglas más restrictivas.

#### Reglas Básicas para Producción

En la consola de Firebase Storage, ve a la pestaña **"Rules"** y reemplaza el contenido con:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura pública de todos los archivos
    match /{allPaths=**} {
      allow read: if true;
    }

    // Permitir escritura solo en carpetas específicas para órdenes
    match /orders/{orderId}/{allPaths=**} {
      allow write: if request.auth != null || true; // Cambiar a "request.auth != null" para requerir autenticación
    }
  }
}
```

**Nota:** Las reglas actuales permiten escritura sin autenticación (`|| true`). Para mayor seguridad, deberías:
- Implementar Firebase Authentication en tu aplicación
- Cambiar las reglas para requerir autenticación (`if request.auth != null`)
- Agregar validaciones adicionales (tamaño de archivo, tipos permitidos, etc.)

#### Reglas Más Restrictivas (Recomendado para Producción)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Función auxiliar para validar tipos de archivo
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }

    function isPDF() {
      return request.resource.contentType == 'application/pdf';
    }

    function isValidSize() {
      return request.resource.size < 10 * 1024 * 1024; // 10MB máximo
    }

    // Lectura pública
    match /{allPaths=**} {
      allow read: if true;
    }

    // Comprobantes: imágenes o PDFs hasta 10MB
    match /orders/{orderId}/comprobantes/{fileName} {
      allow write: if request.auth != null
                   && (isImage() || isPDF())
                   && isValidSize();
    }

    // Arreglos: solo imágenes hasta 10MB
    match /orders/{orderId}/arreglos/{fileName} {
      allow write: if request.auth != null
                   && isImage()
                   && isValidSize();
    }
  }
}
```

### 4. Verificar la Configuración

Después de configurar las reglas:
1. Haz clic en **"Publish"** para aplicar las reglas
2. Verifica que tu Storage Bucket esté activo
3. La URL de tu bucket debe ser: `maflores-5c6c5.firebasestorage.app`

### 5. Estructura de Carpetas

Los archivos se guardarán organizados por ID de orden con la siguiente estructura:

```
Storage Root
└── orders/
    └── {orderId}/
        ├── comprobantes/
        │   └── {uuid}.jpg
        └── arreglos/
            └── {uuid}.png
```

**Ejemplo real:**
```
Storage Root
└── orders/
    ├── 507f1f77bcf86cd799439011/
    │   ├── comprobantes/
    │   │   └── a3f5b8c2-1234-5678-90ab-cdef12345678.jpg
    │   └── arreglos/
    │       └── b4g6c9d3-2345-6789-01bc-def123456789.png
    └── 507f1f77bcf86cd799439012/
        ├── comprobantes/
        │   └── c5h7d0e4-3456-7890-12cd-ef1234567890.pdf
        └── arreglos/
            └── d6i8e1f5-4567-8901-23de-f12345678901.jpg
```

### 6. Monitoreo y Cuotas

Firebase Storage tiene las siguientes cuotas en el plan gratuito (Spark):
- **Almacenamiento:** 5 GB
- **Descarga diaria:** 1 GB/día
- **Operaciones de subida:** 20,000/día
- **Operaciones de descarga:** 50,000/día

Para monitorear el uso:
1. En Firebase Console, ve a **"Storage"** → **"Usage"**
2. Aquí puedes ver cuánto almacenamiento estás utilizando
3. Si necesitas más espacio, considera actualizar al plan Blaze (pago por uso)

### 7. Backup y Seguridad

Recomendaciones:
- **Habilita versionado** en Google Cloud Console para recuperar archivos eliminados
- **Configura políticas de lifecycle** para eliminar archivos antiguos automáticamente
- **Implementa validación del lado del cliente** para rechazar archivos demasiado grandes antes de subirlos
- **Considera encriptación adicional** para archivos sensibles

## Integración con la Aplicación

El código ya está integrado en tu aplicación:

### Frontend
- **Configuración:** `Frontend/lib/firebase.ts`
- **Servicio de Storage:** `Frontend/services/firebaseStorage.ts`
- **Componente:** `Frontend/features/branch/modules/orders/NewOrderPage.tsx`

### Backend
- **Modelo actualizado:** `Backend/src/models/Order.js`
- Campos agregados:
  - `comprobanteUrl`: URL de descarga del comprobante
  - `comprobantePath`: Ruta en Firebase Storage (para eliminar el archivo si es necesario)
  - `arregloUrl`: URL de descarga de la imagen del arreglo
  - `arregloPath`: Ruta en Firebase Storage

## Uso

1. El usuario selecciona archivos en los inputs de "Adjunte el comprobante" y "Adjunte arreglo"
2. Al crear la orden, los archivos se suben automáticamente a Firebase Storage
3. Las URLs de descarga se guardan en la base de datos MongoDB
4. Los archivos quedan disponibles para consulta posterior mediante las URLs

## Solución de Problemas

### Error: "Firebase Storage: User does not have permission to access"
- Verifica que las reglas de seguridad estén publicadas correctamente
- En modo de desarrollo, puedes usar reglas permisivas temporalmente

### Error: "quota exceeded"
- Has alcanzado el límite de almacenamiento o transferencia
- Considera actualizar al plan Blaze o limpiar archivos antiguos

### Los archivos no se suben
- Verifica la consola del navegador para ver errores específicos
- Asegúrate de que Firebase esté inicializado correctamente
- Verifica que la configuración en `firebase.ts` sea correcta
