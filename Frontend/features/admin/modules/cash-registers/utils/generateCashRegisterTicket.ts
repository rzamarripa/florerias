import { CashRegisterSummary } from "../types";

export const generateCashRegisterTicket = (
  summary: CashRegisterSummary,
  closureData: {
    closedBy: string;
    closureDate: string;
    folioNumber: string;
    remainingBalance: number;
  }
): string => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Corte de Caja - ${summary.cashRegister.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20mm;
            background: white;
            font-size: 11pt;
            line-height: 1.4;
        }

        .ticket-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
        }

        .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 5px;
            color: #000;
        }

        .header h2 {
            font-size: 18pt;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }

        .header .folio {
            font-size: 12pt;
            font-weight: bold;
            color: #666;
        }

        .info-section {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #dee2e6;
        }

        .info-row:last-child {
            border-bottom: none;
        }

        .info-label {
            font-weight: bold;
            color: #495057;
        }

        .info-value {
            color: #212529;
        }

        .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #000;
            text-transform: uppercase;
        }

        .totals-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }

        .total-card {
            padding: 15px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            background: white;
        }

        .total-card.highlight {
            background: #e7f3ff;
            border-color: #007bff;
        }

        .total-card.final {
            background: #d4edda;
            border-color: #28a745;
            grid-column: 1 / -1;
        }

        .total-label {
            font-size: 10pt;
            color: #6c757d;
            margin-bottom: 5px;
        }

        .total-amount {
            font-size: 18pt;
            font-weight: bold;
            color: #000;
        }

        .total-card.final .total-amount {
            font-size: 24pt;
            color: #28a745;
        }

        .payment-types {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .payment-card {
            padding: 12px;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            background: #f8f9fa;
        }

        .payment-label {
            font-size: 9pt;
            color: #6c757d;
            margin-bottom: 4px;
        }

        .payment-amount {
            font-size: 14pt;
            font-weight: bold;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9pt;
        }

        table thead {
            background: #343a40;
            color: white;
        }

        table th {
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 8pt;
        }

        table tbody tr {
            border-bottom: 1px solid #dee2e6;
        }

        table tbody tr:hover {
            background: #f8f9fa;
        }

        table td {
            padding: 8px;
        }

        .payment-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 600;
            color: white;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #000;
            text-align: center;
        }

        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-around;
        }

        .signature-box {
            text-align: center;
            width: 200px;
        }

        .signature-line {
            border-top: 2px solid #000;
            margin-bottom: 8px;
            padding-top: 40px;
        }

        .signature-label {
            font-size: 9pt;
            font-weight: bold;
            color: #495057;
        }

        @media print {
            body {
                padding: 0;
            }

            .ticket-container {
                max-width: 100%;
            }

            @page {
                size: A4;
                margin: 15mm;
            }
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <!-- Header -->
        <div class="header">
            <h1>${summary.cashRegister.branchId.branchName}</h1>
            <h2>CORTE DE CAJA</h2>
            <div class="folio">Folio: ${closureData.folioNumber}</div>
        </div>

        <!-- Información General -->
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Caja:</span>
                <span class="info-value">${summary.cashRegister.name}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Sucursal:</span>
                <span class="info-value">${summary.cashRegister.branchId.branchName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Cajero:</span>
                <span class="info-value">${closureData.closedBy}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Fecha de Apertura:</span>
                <span class="info-value">${formatDate(summary.cashRegister.lastOpen!)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Fecha de Cierre:</span>
                <span class="info-value">${formatDate(closureData.closureDate)}</span>
            </div>
        </div>

        <!-- Resumen de Totales -->
        <div class="section-title">Resumen de Caja</div>
        <div class="totals-grid">
            <div class="total-card">
                <div class="total-label">Saldo Inicial</div>
                <div class="total-amount">${formatCurrency(summary.totals.initialBalance)}</div>
            </div>

            <div class="total-card highlight">
                <div class="total-label">( + ) Total Ventas</div>
                <div class="total-amount">${formatCurrency(summary.totals.totalSales)}</div>
            </div>

            <div class="total-card">
                <div class="total-label">( - ) Total Gastos</div>
                <div class="total-amount" style="color: #dc3545;">${formatCurrency(summary.totals.totalExpenses)}</div>
            </div>

            <div class="total-card">
                <div class="total-label">Número de Ventas</div>
                <div class="total-amount" style="font-size: 14pt;">${summary.orders.length}</div>
            </div>

            <div class="total-card final">
                <div class="total-label" style="font-size: 12pt;">SALDO FINAL DE CAJA</div>
                <div class="total-amount">${formatCurrency(summary.totals.currentBalance)}</div>
            </div>

            <div class="total-card" style="background: #fff3cd; border-color: #ffc107; grid-column: 1 / -1;">
                <div class="total-label" style="font-size: 11pt; color: #856404;">( - ) SALDO QUE QUEDA EN CAJA</div>
                <div class="total-amount" style="font-size: 20pt; color: #856404;">${formatCurrency(closureData.remainingBalance)}</div>
            </div>

            <div class="total-card" style="background: #d1ecf1; border-color: #0c5460; grid-column: 1 / -1;">
                <div class="total-label" style="font-size: 11pt; color: #0c5460;">( = ) RETIRO TOTAL</div>
                <div class="total-amount" style="font-size: 22pt; color: #0c5460;">${formatCurrency(summary.totals.currentBalance - closureData.remainingBalance)}</div>
            </div>
        </div>

        <!-- Detalle de Ventas -->
        <div class="section-title">Detalle de Ventas</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">No.</th>
                    <th style="width: 15%;">Fecha</th>
                    <th style="width: 12%;">Forma de Pago</th>
                    <th style="width: 20%;">Cliente</th>
                    <th style="width: 15%;">No. Venta</th>
                    <th style="width: 10%;">Productos</th>
                    <th style="width: 15%; text-align: right;">Importe</th>
                </tr>
            </thead>
            <tbody>
                ${
                  summary.orders.length === 0
                    ? '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #6c757d;">No se registraron ventas</td></tr>'
                    : summary.orders
                        .map(
                          (order, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td style="font-size: 8pt;">${formatDate(order.createdAt)}</td>
                        <td>
                            ${order.paymentMethod.split(', ').map((method: string) => {
                              let bgColor = '#6c757d'; // default gray
                              if (method.toLowerCase().includes('efectivo')) {
                                bgColor = '#28a745'; // green
                              } else if (method.toLowerCase().includes('tarjeta') || method.toLowerCase().includes('crédito') || method.toLowerCase().includes('credito')) {
                                bgColor = '#17a2b8'; // info blue
                              } else if (method.toLowerCase().includes('transferencia')) {
                                bgColor = '#007bff'; // primary blue
                              }
                              return `<span class="payment-badge" style="background-color: ${bgColor}; margin: 2px;">${method}</span>`;
                            }).join(' ')}
                        </td>
                        <td>
                            <div style="font-weight: 600;">${order.clientName}</div>
                            <div style="font-size: 8pt; color: #6c757d;">Para: ${order.recipientName}</div>
                        </td>
                        <td style="font-weight: 600;">${order.orderNumber}</td>
                        <td style="text-align: center;">${order.itemsCount}</td>
                        <td style="text-align: right; font-weight: bold;">${formatCurrency(order.advance)}</td>
                    </tr>
                `
                        )
                        .join("")
                }
            </tbody>
        </table>

        <!-- Detalle de Gastos -->
        <div class="section-title">Detalle de Gastos</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 10%;">Folio</th>
                    <th style="width: 20%;">Fecha</th>
                    <th style="width: 25%;">Concepto</th>
                    <th style="width: 25%;">Usuario</th>
                    <th style="width: 20%; text-align: right;">Importe</th>
                </tr>
            </thead>
            <tbody>
                ${
                  summary.expenses.length === 0
                    ? '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6c757d;">No se registraron gastos</td></tr>'
                    : summary.expenses
                        .map(
                          (expense) => `
                    <tr>
                        <td style="font-weight: 600;">${expense.folio}</td>
                        <td style="font-size: 8pt;">${formatDate(expense.paymentDate)}</td>
                        <td>
                            <div style="font-weight: 600;">${expense.concept}</div>
                            ${expense.conceptDescription ? `<div style="font-size: 8pt; color: #6c757d;">${expense.conceptDescription}</div>` : ''}
                        </td>
                        <td>${expense.user}</td>
                        <td style="text-align: right; font-weight: bold; color: #dc3545;">${formatCurrency(expense.total)}</td>
                    </tr>
                `
                        )
                        .join("")
                }
            </tbody>
        </table>

        <!-- Detalle de Compras en Efectivo -->
        <div class="section-title">Detalle de Compras en Efectivo</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 8%;">Folio</th>
                    <th style="width: 15%;">Fecha</th>
                    <th style="width: 20%;">Concepto</th>
                    <th style="width: 20%;">Proveedor</th>
                    <th style="width: 17%;">Usuario</th>
                    <th style="width: 20%; text-align: right;">Importe</th>
                </tr>
            </thead>
            <tbody>
                ${
                  summary.buys.length === 0
                    ? '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6c757d;">No se registraron compras en efectivo</td></tr>'
                    : summary.buys
                        .map(
                          (buy) => `
                    <tr>
                        <td style="font-weight: 600;">${buy.folio}</td>
                        <td style="font-size: 8pt;">${formatDate(buy.paymentDate)}</td>
                        <td>
                            <div style="font-weight: 600;">${buy.concept}</div>
                            ${buy.description ? `<div style="font-size: 8pt; color: #6c757d;">${buy.description}</div>` : ''}
                        </td>
                        <td>${buy.provider}</td>
                        <td>${buy.user}</td>
                        <td style="text-align: right; font-weight: bold; color: #856404;">${formatCurrency(buy.amount)}</td>
                    </tr>
                `
                        )
                        .join("")
                }
            </tbody>
        </table>

        <!-- Firma -->
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Firma del Cajero</div>
                <div style="font-size: 8pt; color: #6c757d; margin-top: 4px;">${closureData.closedBy}</div>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Firma del Gerente</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="font-size: 9pt; color: #6c757d;">
                Documento generado el ${formatDate(new Date().toISOString())}
            </p>
            <p style="font-size: 8pt; color: #adb5bd; margin-top: 8px;">
                Este documento es un comprobante del corte de caja realizado
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
