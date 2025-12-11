export interface SaleTicketData {
  order: {
    orderNumber: string;
    createdAt: string;
    clientInfo: {
      name: string;
      phone: string;
    };
    deliveryData: {
      recipientName: string;
      deliveryDateTime: string;
      message: string;
      street?: string;
      reference?: string;
    };
    items: Array<{
      quantity: number;
      productName: string;
      amount: number;
    }>;
    subtotal: number;
    discount: number;
    discountType: "porcentaje" | "cantidad";
    total: number;
    advance: number;
    remainingBalance: number;
    shippingType: string;
    deliveryPrice?: number;
    paymentMethod: string;
  };
  company: {
    companyName: string;
    rfc: string;
    address: {
      street: string;
      externalNumber: string;
      internalNumber?: string;
      neighborhood: string;
      city: string;
      state: string;
    };
    phone: string;
    logoUrl?: string;
  };
  cashier: {
    fullName: string;
  };
  payments: Array<{
    amount: number;
    date: string;
  }>;
}

export const generateSaleTicket = (data: SaleTicketData): string => {
  const { order, company, cashier, payments } = data;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calcular saldo anterior (total menos pagos realizados más el adelanto actual)
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const previousBalance = order.total + totalPaid - order.advance;

  const companyAddress = `${company.address.street} #${company.address.externalNumber}${
    company.address.internalNumber ? ` Int. ${company.address.internalNumber}` : ""
  }, ${company.address.neighborhood}`;
  const cityState = `${company.address.city}, ${company.address.state}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recibo - ${order.orderNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            padding: 20mm;
            background: #f5f5f5;
            color: #333;
        }

        .ticket-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 20px;
        }

        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
            margin-bottom: 20px;
        }

        .company-name {
            font-size: 20pt;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
        }

        .company-info {
            font-size: 10pt;
            line-height: 1.5;
            color: #555;
        }

        .info-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 8px;
            border: 1px solid #ddd;
            font-size: 10pt;
        }

        .info-table td:first-child {
            font-weight: bold;
            width: 35%;
            background: #f8f9fa;
        }

        .items-table {
            width: 100%;
            margin: 20px 0;
            border-collapse: collapse;
        }

        .items-table th {
            background: #333;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 10pt;
            font-weight: bold;
        }

        .items-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
            font-size: 10pt;
        }

        .items-table tr:last-child td {
            border-bottom: 2px solid #333;
        }

        .totals-section {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 11pt;
        }

        .total-row.final {
            font-size: 14pt;
            font-weight: bold;
            border-top: 2px solid #333;
            padding-top: 12px;
            margin-top: 8px;
        }

        .delivery-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }

        .delivery-section h3 {
            font-size: 12pt;
            margin-bottom: 10px;
            color: #333;
        }

        .delivery-info {
            font-size: 10pt;
            line-height: 1.6;
        }

        .message-box {
            margin-top: 10px;
            padding: 10px;
            background: #fff9e6;
            border-left: 3px solid #ffc107;
            font-style: italic;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10pt;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }

        .social-info {
            margin-top: 10px;
            line-height: 1.6;
        }

        @media print {
            body {
                padding: 0;
                background: white;
            }

            .ticket-container {
                max-width: 100%;
                padding: 10px;
            }

            @page {
                size: A4;
                margin: 10mm;
            }
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <!-- Header -->
        <div class="header">
            ${
              company.logoUrl
                ? `<div style="text-align: center; margin-bottom: 15px;">
                <img src="${company.logoUrl}" alt="Logo ${company.companyName}" style="max-width: 150px; max-height: 80px; object-fit: contain;" />
            </div>`
                : ""
            }
            <div class="company-name">${company.companyName}</div>
            <div class="company-info">
                RFC: ${company.rfc}<br>
                ${companyAddress}<br>
                ${cityState}<br>
                TEL: ${company.phone}
            </div>
        </div>

        <!-- Información General -->
        <table class="info-table">
            <tr>
                <td>RECIBO NO. :</td>
                <td>${order.orderNumber}</td>
            </tr>
            <tr>
                <td>FECHA :</td>
                <td>${formatDate(order.createdAt)}</td>
            </tr>
            <tr>
                <td>CLIENTE :</td>
                <td>${order.clientInfo.name}</td>
            </tr>
            <tr>
                <td>TEL :</td>
                <td>${order.clientInfo.phone || "N/A"}</td>
            </tr>
            <tr>
                <td>FORMA DE PAGO :</td>
                <td>${order.paymentMethod}</td>
            </tr>
            <tr>
                <td>VENDEDOR :</td>
                <td>${cashier.fullName}</td>
            </tr>
        </table>

        <!-- Productos -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 15%;">CANT.</th>
                    <th style="width: 60%;">CONCEPTO</th>
                    <th style="width: 25%; text-align: right;">IMPORTE</th>
                </tr>
            </thead>
            <tbody>
                ${order.items
                  .map(
                    (item) => `
                    <tr>
                        <td>${item.quantity}</td>
                        <td>${item.productName}</td>
                        <td style="text-align: right;">${formatCurrency(item.amount)}</td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>

        <!-- Totales -->
        <div class="totals-section">
            <div class="total-row">
                <span>Total:</span>
                <span>${formatCurrency(order.subtotal)}</span>
            </div>
            ${
              order.discount > 0
                ? `
            <div class="total-row" style="color: #dc3545;">
                <span>Descuento (${
                  order.discountType === "porcentaje" ? `${order.discount}%` : formatCurrency(order.discount)
                }):</span>
                <span>-${formatCurrency(
                  order.discountType === "porcentaje" ? (order.subtotal * order.discount) / 100 : order.discount
                )}</span>
            </div>
            `
                : ""
            }
            ${
              order.shippingType === "envio" && order.deliveryPrice
                ? `
            <div class="total-row" style="color: #28a745;">
                <span>Envío:</span>
                <span>+${formatCurrency(order.deliveryPrice)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row">
                <span>Saldo Anterior:</span>
                <span>${formatCurrency(previousBalance)}</span>
            </div>
            <div class="total-row">
                <span>Pago ( - ):</span>
                <span>${formatCurrency(order.advance)}</span>
            </div>
            <div class="total-row final">
                <span>Saldo:</span>
                <span>${formatCurrency(order.remainingBalance)}</span>
            </div>
        </div>

        <!-- Información de Entrega -->
        <div class="delivery-section">
            <h3>ENTREGAR A:</h3>
            <div class="delivery-info">
                <strong>${order.deliveryData.recipientName}</strong>
                ${order.clientInfo.phone ? ` - Cel: ${order.clientInfo.phone}` : ""}<br>
                <strong>FECHA ENTREGA:</strong> ${formatDateTime(order.deliveryData.deliveryDateTime)}
                ${
                  order.shippingType === "envio" && order.deliveryData.street
                    ? `<br><strong>DIRECCIÓN:</strong> ${order.deliveryData.street}${
                        order.deliveryData.reference ? `<br><strong>REFERENCIA:</strong> ${order.deliveryData.reference}` : ""
                      }`
                    : ""
                }
            </div>
            ${
              order.deliveryData.message
                ? `
            <div class="message-box">
                <strong>COMENTARIO:</strong><br>
                ${order.deliveryData.message}
            </div>
            `
                : ""
            }
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="margin-top: 15px; font-weight: bold;">
                ¡GRACIAS POR ELEGIRNOS!
            </p>
        </div>
    </div>

    <script>
        // Auto-imprimir al cargar
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>
  `.trim();
};
