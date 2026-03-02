import html2canvas from 'html2canvas';

/**
 * Convierte un string HTML a imagen PNG usando html2canvas dentro de un iframe aislado.
 * El iframe evita que los estilos globales de la app (oklch/lab) interfieran con html2canvas.
 */
export const convertHtmlToImage = async (
  htmlString: string,
  options?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
  }
): Promise<Blob> => {
  if (!htmlString || htmlString.trim().length === 0) {
    throw new Error('El HTML está vacío o es inválido');
  }

  const width = options?.width || 500;
  const bgColor = options?.backgroundColor || '#ffffff';
  const hasCompleteHtml = htmlString.includes('<!DOCTYPE') || htmlString.includes('<html');

  // Crear iframe oculto para aislar del CSS global (oklch/lab no soportado por html2canvas)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = `${width}px`;
  iframe.style.height = '3000px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('No se pudo acceder al documento del iframe');
    }

    // Escribir el HTML del ticket en el iframe
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
              width: ${width}px;
              background: ${bgColor};
              font-family: 'Courier New', Courier, monospace;
            }
          </style>
        </head>
        <body>${htmlString}</body>
        </html>
      `);
      iframeDoc.close();
    }

    // Esperar a que el iframe renderice el contenido
    await new Promise(resolve => setTimeout(resolve, 500));

    // Obtener el elemento objetivo dentro del iframe
    const targetElement = (
      iframeDoc.querySelector('.ticket-container') ||
      iframeDoc.body.firstElementChild ||
      iframeDoc.body
    ) as HTMLElement;

    if (!targetElement || !targetElement.innerHTML?.trim()) {
      throw new Error('El contenido del iframe está vacío');
    }

    // Renderizar con html2canvas (el iframe aísla de los estilos oklch del documento principal)
    const canvas = await html2canvas(targetElement, {
      backgroundColor: bgColor,
      scale: 2,
      useCORS: true,
      width: width,
      logging: false,
    });

    // Convertir canvas a Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('No se pudo convertir canvas a blob'))),
        'image/png'
      );
    });

    return blob;
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
};

/**
 * Convierte un elemento DOM existente a imagen PNG
 */
export const convertElementToImage = async (
  element: HTMLElement,
  options?: {
    backgroundColor?: string;
    pixelRatio?: number;
  }
): Promise<Blob> => {
  const canvas = await html2canvas(element, {
    backgroundColor: options?.backgroundColor || '#ffffff',
    scale: options?.pixelRatio || 2,
    useCORS: true,
    logging: false,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo convertir canvas a blob'))),
      'image/png'
    );
  });
};
