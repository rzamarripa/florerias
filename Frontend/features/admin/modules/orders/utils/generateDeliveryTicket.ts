export interface DeliveryTicketData {
  order: {
    orderNumber: string;
    anonymous?: boolean;
    clientInfo: {
      name: string;
      phone: string;
    };
    deliveryData: {
      recipientName: string;
      deliveryDateTime: string;
      street?: string;
      neighborhoodName?: string;
      reference?: string;
      message?: string;
    };
    branchInfo?: {
      city?: string;
      state?: string;
    };
  };
}

export const generateDeliveryTicket = (data: DeliveryTicketData): string => {
  const { order } = data;

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // Determinar si hay dedicatoria basándose en si existe mensaje
  const hasDedicatoria = order.deliveryData.message && order.deliveryData.message.trim().length > 0;

  // Construir dirección completa
  let fullAddress = order.deliveryData.street || "";
  if (order.branchInfo?.city || order.branchInfo?.state) {
    const cityState = [];
    if (order.branchInfo.city) cityState.push(order.branchInfo.city);
    if (order.branchInfo.state) cityState.push(order.branchInfo.state);
    if (cityState.length > 0) {
      fullAddress += fullAddress ? "\n" : "";
      fullAddress += cityState.join(", ");
    }
  }
  if (order.deliveryData.neighborhoodName) {
    fullAddress += "\nCol: " + order.deliveryData.neighborhoodName;
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Entrega - ${order.orderNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier New', monospace;
            font-size: 14pt;
            line-height: 1.6;
            padding: 20px;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
        }

        .ticket-container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            box-sizing: border-box;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .order-number {
            text-align: right;
            font-weight: bold;
            font-size: 16pt;
            margin-bottom: 15px;
        }

        .field-row {
            margin-bottom: 12px;
            display: flex;
            flex-direction: column;
        }

        .field-label {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 4px;
        }

        .field-value {
            font-size: 14pt;
            padding-left: 15px;
            white-space: pre-line;
        }

        .checkbox-section {
            margin: 20px 0;
            display: flex;
            align-items: center;
            gap: 30px;
        }

        .checkbox-section .field-label {
            margin-bottom: 0;
        }

        .checkbox-option {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .checkbox {
            width: 18px;
            height: 18px;
            border: 2px solid #000;
            display: inline-block;
            position: relative;
            vertical-align: middle;
        }

        .checkbox.checked::after {
            content: "✓";
            position: absolute;
            top: -4px;
            left: 2px;
            font-size: 18px;
            font-weight: bold;
        }

        .signature-section {
            margin-top: 50px;
            padding-top: 20px;
            text-align: center;
        }

        .signature-line {
            border-bottom: 2px solid #000;
            width: 80%;
            margin: 0 auto 5px;
        }

        .signature-label {
            font-size: 10pt;
            font-weight: normal;
        }

        @media print {
            body {
                padding: 0;
                background: white;
                min-height: auto;
                display: block;
            }

            .ticket-container {
                max-width: 80mm;
                padding: 10px;
                box-shadow: none;
            }

            @page {
                size: 80mm auto;
                margin: 0;
            }
        }

        /* Estilos específicos para centrado en la ventana de visualización */
        @media screen {
            body {
                font-size: 14pt;
            }
            .ticket-container {
                max-width: 400px;
            }
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <div class="order-number">${order.orderNumber}</div>

        <div class="field-row">
            <span class="field-label">CLIENTE:</span>
            <span class="field-value">${order.anonymous ? 'ANÓNIMO' : order.clientInfo.name.toUpperCase()}</span>
        </div>

        <div class="field-row">
            <span class="field-label">TEL:</span>
            <span class="field-value">${order.clientInfo.phone}</span>
        </div>

        <div class="field-row">
            <span class="field-label">ENTREGAR A:</span>
            <span class="field-value">${order.deliveryData.recipientName.toUpperCase()}
${order.clientInfo.phone}</span>
        </div>

        <div class="field-row">
            <span class="field-label">FECHA ENTREGA:</span>
            <span class="field-value">${formatDateTime(order.deliveryData.deliveryDateTime)}</span>
        </div>

        <div class="field-row">
            <span class="field-label">DIRECCIÓN:</span>
            <span class="field-value">${fullAddress}</span>
        </div>

        ${order.deliveryData.reference ? `
        <div class="field-row">
            <span class="field-label">SEÑAS PARTICULARES:</span>
            <span class="field-value">${order.deliveryData.reference}</span>
        </div>
        ` : ''}

        <div class="checkbox-section">
            <span class="field-label">DEDICATORIA:</span>
            <div class="checkbox-option">
                <span class="checkbox ${hasDedicatoria ? 'checked' : ''}"></span>
                <span>SI</span>
            </div>
            <div class="checkbox-option">
                <span class="checkbox ${!hasDedicatoria ? 'checked' : ''}"></span>
                <span>NO</span>
            </div>
        </div>

        <div class="signature-section">
            <div class="signature-line"></div>
            <div class="signature-label">Firma de Recibido</div>
        </div>
    </div>

    <script>
        // Cerrar ventana después de imprimir
        window.onafterprint = function() {
            window.close();
        };
    </script>
</body>
</html>
  `.trim();
};