import { toPng } from 'html-to-image';

/**
 * Sanitiza las declaraciones de font-family en el HTML para evitar problemas con html-to-image
 */
const sanitizeFontDeclarations = (html: string): string => {
  // Remover comillas simples y dobles de font-family
  let sanitized = html.replace(/font-family:\s*['"]([^'"]+)['"]\s*,/g, 'font-family: $1,');
  
  // Remover comillas de nombres de fuentes individuales
  sanitized = sanitized.replace(/font-family:\s*([^;]+);/g, (match, fonts) => {
    const cleanedFonts = fonts.replace(/['"]([^'"]+)['"]/g, '$1');
    return `font-family: ${cleanedFonts};`;
  });
  
  // Remover reglas @font-face completas que pueden causar problemas
  sanitized = sanitized.replace(/@font-face\s*{[^}]*}/gi, '');
  
  // Remover cualquier referencia a variables CSS no definidas
  sanitized = sanitized.replace(/font-family:\s*var\([^)]*\)/gi, 'font-family: monospace');
  
  // Asegurar que no haya font-family vacías
  sanitized = sanitized.replace(/font-family:\s*;/gi, 'font-family: monospace;');
  
  return sanitized;
};

/**
 * Convierte un string HTML a imagen PNG
 * @param htmlString - El HTML como string
 * @param options - Opciones de conversión
 * @returns Blob de la imagen PNG
 */
export const convertHtmlToImage = async (
  htmlString: string,
  options?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
  }
): Promise<Blob> => {
  try {
    console.log('[convertHtmlToImage] Iniciando conversión HTML a imagen...');
    console.log('[convertHtmlToImage] Longitud del HTML:', htmlString.length);

    // Validar que el HTML no esté vacío
    if (!htmlString || htmlString.trim().length === 0) {
      throw new Error('El HTML está vacío o es inválido');
    }

    // NO sanitizar aquí porque lo haremos después de verificar si es HTML completo

    // Crear un contenedor temporal en el DOM
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = `${options?.width || 400}px`;
    container.style.backgroundColor = options?.backgroundColor || 'white';
    // Eliminamos fontFamily que causa problemas con html-to-image
    
    // Crear un iframe para aislar el CSS
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = `${options?.width || 600}px`;
    iframe.style.height = '3000px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Obtener el documento del iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      throw new Error('No se pudo acceder al iframe');
    }

    // Extraer el body del HTML para preservar todos los estilos
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const hasCompleteHtml = htmlString.includes('<!DOCTYPE') || htmlString.includes('<html');
    
    // Siempre usar el HTML completo para asegurar renderizado correcto
    if (hasCompleteHtml) {
      // Sanitizar antes de escribir al iframe
      const sanitizedHtml = sanitizeFontDeclarations(htmlString);
      iframeDoc.open();
      iframeDoc.write(sanitizedHtml);
      iframeDoc.close();
    } else {
      // Si no es HTML completo, envolverlo apropiadamente
      const sanitizedContent = sanitizeFontDeclarations(htmlString);
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              width: ${options?.width || 600}px;
              background: white;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          ${sanitizedContent}
        </body>
        </html>
      `);
      iframeDoc.close();
    }

    // Esperar más tiempo para que se renderice completamente
    console.log('[convertHtmlToImage] Esperando renderizado del iframe...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Forzar el renderizado del iframe
    iframe.contentWindow?.document.documentElement.offsetHeight;
    
    // Obtener el body del iframe
    const body = iframeDoc.body;
    
    // Asegurar que el contenido esté completamente cargado
    if (!body || body.innerHTML.trim() === '') {
      console.error('[convertHtmlToImage] El body del iframe está vacío');
      throw new Error('El iframe no se renderizó correctamente');
    }
    
    // Esperar a que las imágenes y estilos se carguen completamente
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Obtener el elemento del ticket (primer hijo del body normalmente)
    const ticketElement = body.querySelector('.ticket-container') || body.firstElementChild || body;
    
    // Convertir a PNG con opciones mejoradas
    console.log('[convertHtmlToImage] Convirtiendo DOM a PNG...');
    console.log('[convertHtmlToImage] Ancho del elemento:', (ticketElement as HTMLElement).scrollWidth);
    console.log('[convertHtmlToImage] Alto del elemento:', (ticketElement as HTMLElement).scrollHeight);
    
    const dataUrl = await toPng(ticketElement as HTMLElement, {
      width: options?.width || 600,
      height: (ticketElement as HTMLElement).scrollHeight,
      backgroundColor: options?.backgroundColor || '#ffffff',
      pixelRatio: 1,
      cacheBust: false,
      skipFonts: true  // Evitar el procesamiento de fuentes que causa errores
    } as any);  // as any porque skipFonts puede no estar en los tipos

    // Limpiar el iframe
    document.body.removeChild(iframe);

    // Convertir dataURL a Blob
    console.log('[convertHtmlToImage] Convirtiendo dataURL a Blob...');
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    console.log('[convertHtmlToImage] Conversión exitosa, tamaño del blob:', blob.size);
    return blob;

  } catch (error) {
    console.error('[convertHtmlToImage] Error detallado:', error);
    console.error('[convertHtmlToImage] Intentando método alternativo con iframe...');
    // Intentar método alternativo si falla
    return await convertHtmlToImageAlternative(htmlString, options);
  }
};

/**
 * Método alternativo para convertir HTML a imagen usando Canvas
 */
const convertHtmlToImageAlternative = async (
  htmlString: string,
  options?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
  }
): Promise<Blob> => {
  try {
    console.log('[convertHtmlToImageAlternative] Usando método alternativo con iframe...');
    
    // Crear iframe para el método alternativo también
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = `${options?.width || 600}px`;
    iframe.style.height = '3000px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      throw new Error('No se pudo acceder al iframe en método alternativo');
    }
    
    // Insertar el HTML con estructura completa si es necesario
    const hasCompleteHtml = htmlString.includes('<!DOCTYPE') || htmlString.includes('<html');
    
    if (hasCompleteHtml) {
      // Sanitizar HTML completo
      const sanitizedHtml = sanitizeFontDeclarations(htmlString);
      iframeDoc.open();
      iframeDoc.write(sanitizedHtml);
      iframeDoc.close();
    } else {
      // Sanitizar contenido parcial
      const sanitizedContent = sanitizeFontDeclarations(htmlString);
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              width: ${options?.width || 600}px;
              background: ${options?.backgroundColor || 'white'};
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          ${sanitizedContent}
        </body>
        </html>
      `);
      iframeDoc.close();
    }

    // Esperar renderizado con más tiempo
    console.log('[convertHtmlToImageAlternative] Esperando renderizado...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar que el contenido se haya cargado
    if (!iframeDoc.body || iframeDoc.body.innerHTML.trim() === '') {
      console.error('[convertHtmlToImageAlternative] El contenido no se cargó en el iframe');
      throw new Error('Fallo al cargar el contenido en el iframe');
    }
    
    // Obtener el elemento del ticket
    const body = iframeDoc.body;
    const ticketElement = body.querySelector('.ticket-container') || body.firstElementChild || body;

    console.log('[convertHtmlToImageAlternative] Intentando conversión con configuración mínima...');
    // Convertir con configuración mínima sin procesamiento de fuentes
    const dataUrl = await toPng(ticketElement as HTMLElement, {
      width: options?.width || 600,
      backgroundColor: options?.backgroundColor || '#ffffff',
      pixelRatio: 1,
      cacheBust: false,
      skipFonts: true  // Evitar el procesamiento de fuentes
    } as any);

    // Limpiar
    document.body.removeChild(iframe);

    // Convertir a Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    console.log('[convertHtmlToImageAlternative] Conversión exitosa, tamaño:', blob.size);
    return blob;
    
  } catch (error) {
    console.error('[convertHtmlToImageAlternative] Error en método alternativo:', error);
    console.log('[convertHtmlToImageAlternative] Intentando método de fallback sin iframe...');
    // Intentar tercer método sin iframe
    return await convertHtmlToImageFallback(htmlString, options);
  }
};

/**
 * Método de fallback final sin iframe
 */
const convertHtmlToImageFallback = async (
  htmlString: string,
  options?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
  }
): Promise<Blob> => {
  try {
    console.log('[convertHtmlToImageFallback] Usando método de fallback sin iframe...');
    
    // Sanitizar el HTML primero
    const sanitizedHtml = sanitizeFontDeclarations(htmlString);
    
    // Crear un contenedor directamente en el DOM (sin iframe)
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${options?.width || 600}px`;
    container.style.backgroundColor = options?.backgroundColor || 'white';
    container.style.padding = '20px';
    container.style.fontFamily = 'monospace';
    
    // Insertar el HTML sanitizado
    container.innerHTML = sanitizedHtml;
    document.body.appendChild(container);

    // Esperar a que se renderice
    console.log('[convertHtmlToImageFallback] Esperando renderizado directo...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Buscar el elemento principal o usar el contenedor
    const ticketElement = container.querySelector('.ticket-container') || container;
    
    console.log('[convertHtmlToImageFallback] Intentando conversión simple...');
    
    try {
      // Intentar conversión con configuración muy básica sin fuentes
      const dataUrl = await toPng(ticketElement as HTMLElement, {
        backgroundColor: '#ffffff',
        pixelRatio: 1,
        cacheBust: false,
        skipFonts: true  // Crítico: evitar el procesamiento de fuentes
      } as any);

      // Limpiar el contenedor
      document.body.removeChild(container);

      // Convertir a Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      console.log('[convertHtmlToImageFallback] Conversión exitosa con fallback, tamaño:', blob.size);
      return blob;
    } catch (pngError) {
      // Limpiar el contenedor en caso de error
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      throw pngError;
    }
    
  } catch (error) {
    console.error('[convertHtmlToImageFallback] Error en método de fallback:', error);
    console.error('[convertHtmlToImageFallback] Detalles del error:', {
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    
    // Intentar método final con canvas nativo
    console.log('[convertHtmlToImageFallback] Intentando método con canvas nativo...');
    return await convertWithCanvas(htmlString, options);
  }
};

/**
 * Método de último recurso usando canvas nativo sin html-to-image
 */
const convertWithCanvas = async (
  htmlString: string,
  options?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
  }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('[convertWithCanvas] Usando canvas nativo como último recurso...');
      
      // Crear un contenedor temporal
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.width = `${options?.width || 600}px`;
      container.style.backgroundColor = options?.backgroundColor || 'white';
      
      // Sanitizar e insertar HTML
      container.innerHTML = sanitizeFontDeclarations(htmlString);
      document.body.appendChild(container);
      
      // Crear un canvas del tamaño apropiado
      const canvas = document.createElement('canvas');
      const ticketElement = container.querySelector('.ticket-container') || container;
      const width = options?.width || 600;
      const height = (ticketElement as HTMLElement).scrollHeight || 800;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        document.body.removeChild(container);
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }
      
      // Llenar el fondo
      ctx.fillStyle = options?.backgroundColor || 'white';
      ctx.fillRect(0, 0, width, height);
      
      // Como último recurso, crear una imagen simple con el texto del pedido
      ctx.fillStyle = 'black';
      ctx.font = '14px monospace';
      
      // Extraer texto básico del HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // Dibujar el texto línea por línea
      const lines = textContent.split('\n');
      let y = 30;
      for (const line of lines) {
        if (line.trim()) {
          ctx.fillText(line.trim(), 20, y);
          y += 20;
        }
      }
      
      // Limpiar
      document.body.removeChild(container);
      
      // Convertir canvas a blob
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('[convertWithCanvas] Conversión exitosa con canvas, tamaño:', blob.size);
          resolve(blob);
        } else {
          reject(new Error('No se pudo convertir el canvas a blob'));
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('[convertWithCanvas] Error con canvas nativo:', error);
      reject(new Error('No se pudo convertir el HTML a imagen con ningún método'));
    }
  });
};

/**
 * Convierte un elemento DOM existente a imagen PNG
 * @param element - El elemento DOM a convertir
 * @param options - Opciones de conversión
 * @returns Blob de la imagen PNG
 */
export const convertElementToImage = async (
  element: HTMLElement,
  options?: {
    backgroundColor?: string;
    pixelRatio?: number;
  }
): Promise<Blob> => {
  try {
    console.log('[convertElementToImage] Convirtiendo elemento a imagen...');
    
    const dataUrl = await toPng(element, {
      backgroundColor: options?.backgroundColor || 'white',
      pixelRatio: options?.pixelRatio || 2,
      skipFonts: true  // Consistencia: evitar procesamiento de fuentes
    } as any);

    // Convertir dataURL a Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    console.log('[convertElementToImage] Conversión exitosa, tamaño:', blob.size);
    return blob;

  } catch (error) {
    console.error('[convertElementToImage] Error:', error);
    throw error;
  }
};