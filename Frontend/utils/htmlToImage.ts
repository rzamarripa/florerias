import { toPng } from 'html-to-image';

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

    // Crear un contenedor temporal en el DOM
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = `${options?.width || 400}px`;
    container.style.backgroundColor = options?.backgroundColor || 'white';
    container.style.fontFamily = 'Arial, sans-serif'; // Fuente por defecto
    
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
      throw new Error('No se pudo acceder al iframe');
    }

    // Extraer el body del HTML para preservar todos los estilos
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const hasCompleteHtml = htmlString.includes('<!DOCTYPE') || htmlString.includes('<html');
    
    // Si es un HTML completo, usarlo tal cual
    // Si no, envolverlo en una estructura HTML básica
    if (hasCompleteHtml) {
      iframeDoc.open();
      iframeDoc.write(htmlString);
      iframeDoc.close();
    } else {
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
            }
          </style>
        </head>
        <body>
          ${htmlString}
        </body>
        </html>
      `);
      iframeDoc.close();
    }

    // Esperar un momento para que se renderice
    await new Promise(resolve => setTimeout(resolve, 200));

    // Obtener el body del iframe
    const body = iframeDoc.body;
    
    // Esperar a que las imágenes y estilos se carguen completamente
    await new Promise(resolve => setTimeout(resolve, 300));
    
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
      pixelRatio: 2,
      cacheBust: true,
      filter: (node) => {
        // Filtrar nodos problemáticos
        return !node.classList?.contains('no-print');
      }
    });

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
    console.log('[convertHtmlToImageAlternative] Usando método alternativo...');
    
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
      throw new Error('No se pudo acceder al iframe en método alternativo');
    }
    
    // Insertar el HTML
    iframeDoc.open();
    iframeDoc.write(htmlString);
    iframeDoc.close();

    // Esperar renderizado
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Obtener el elemento del ticket
    const body = iframeDoc.body;
    const ticketElement = body.querySelector('.ticket-container') || body.firstElementChild || body;

    // Convertir con configuración mínima
    const dataUrl = await toPng(ticketElement as HTMLElement, {
      width: options?.width || 600,
      backgroundColor: options?.backgroundColor || '#ffffff',
      pixelRatio: 2
    });

    // Limpiar
    document.body.removeChild(iframe);

    // Convertir a Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    console.log('[convertHtmlToImageAlternative] Conversión exitosa, tamaño:', blob.size);
    return blob;
    
  } catch (error) {
    console.error('[convertHtmlToImageAlternative] Error:', error);
    throw new Error('No se pudo convertir el HTML a imagen');
  }
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
    });

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