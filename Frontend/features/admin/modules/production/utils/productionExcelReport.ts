import ExcelJS from 'exceljs';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  isProduct: boolean;
  productCategory?: any;
}

interface Order {
  _id: string;
  orderNumber: string;
  clientInfo: {
    name: string;
    phone?: string;
    email?: string;
  };
  items: OrderItem[];
  deliveryData: {
    recipientName: string;
    deliveryDateTime: string;
    message?: string;
    street?: string;
    neighborhoodId?: any;
    deliveryPrice?: number;
    reference?: string;
  };
  shippingType?: string;
  salesChannel?: string;
  total: number;
  advance?: number;
  remainingBalance?: number;
  status: string;
  sendToProduction: boolean;
  createdAt: string;
  branchId?: any;
}

interface ProductionOrdersData {
  todayOrders: Order[];
  tomorrowOrders: Order[];
  laterOrders: Order[];
}

// Función para formatear fecha y hora
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    time: date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
};

// Función para formatear moneda
const formatCurrency = (amount: number) => {
  return `$${amount.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Función para obtener el nombre de la sucursal
const getBranchName = (branchId: any): string => {
  if (typeof branchId === 'object' && branchId?.branchName) {
    return branchId.branchName;
  }
  return 'N/A';
};

// Encabezados de las hojas de datos
const headers = [
  'No. Orden',
  'Cliente',
  'Teléfono',
  'Destinatario',
  'Fecha Entrega',
  'Hora Entrega',
  'Productos',
  'Canal de Venta',
  'Tipo de Entrega',
  'Dirección',
  'Referencia',
  'Mensaje',
  'Total',
  'Anticipo',
  'Saldo Pendiente',
  'Estado',
  'En Producción',
  'Sucursal',
  'Fecha Creación'
];

// Anchos de columna
const columnWidths = [12, 25, 15, 25, 12, 12, 50, 15, 20, 30, 25, 30, 12, 12, 15, 12, 12, 20, 12];

// Función para agregar órdenes a una hoja
const addOrdersToSheet = (worksheet: ExcelJS.Worksheet, orders: Order[], sheetTitle: string) => {
  // Configurar anchos de columna
  worksheet.columns = columnWidths.map((width, index) => ({
    header: headers[index],
    width: width
  }));

  // Estilo para encabezados
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  if (orders.length === 0) {
    worksheet.addRow([`No hay órdenes programadas para ${sheetTitle.toLowerCase()}`]);
    return;
  }

  // Agregar datos
  orders.forEach(order => {
    const { date, time } = formatDateTime(order.deliveryData.deliveryDateTime);
    const createdDate = formatDateTime(order.createdAt).date;

    const productsList = order.items
      .map(item => `${item.productName} (x${item.quantity})`)
      .join(', ');

    worksheet.addRow([
      order.orderNumber,
      order.clientInfo.name,
      order.clientInfo.phone || 'N/A',
      order.deliveryData.recipientName,
      date,
      time,
      productsList,
      order.salesChannel || 'tienda',
      order.shippingType === 'envio' ? 'Envío a domicilio' :
        order.shippingType === 'tienda' ? 'Recoger en tienda' : 'Redes sociales',
      order.deliveryData.street || 'N/A',
      order.deliveryData.reference || 'N/A',
      order.deliveryData.message || 'N/A',
      formatCurrency(order.total),
      formatCurrency(order.advance || 0),
      formatCurrency(order.remainingBalance || 0),
      order.status === 'pendiente' ? 'Pendiente' :
        order.status === 'en-proceso' ? 'En Proceso' :
        order.status === 'completado' ? 'Completado' :
        order.status === 'cancelado' ? 'Cancelado' : 'Sin Anticipo',
      order.sendToProduction ? 'Sí' : 'No',
      getBranchName(order.branchId),
      createdDate
    ]);
  });
};

// Función principal para generar el archivo Excel
export const generateProductionExcelReport = async (data: ProductionOrdersData, branchName?: string) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Corazón de Violeta';
  workbook.created = new Date();

  const currentDate = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');

  // Crear hoja de resumen
  const summarySheet = workbook.addWorksheet('Resumen');
  summarySheet.columns = [
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 }
  ];

  // Título
  summarySheet.addRow(['REPORTE DE PRODUCCIÓN']);
  summarySheet.getRow(1).font = { bold: true, size: 14 };
  summarySheet.addRow([]);
  summarySheet.addRow(['Fecha de generación:', currentDate]);
  summarySheet.addRow(['Sucursal:', branchName || 'Todas las sucursales']);
  summarySheet.addRow([]);
  summarySheet.addRow(['RESUMEN']);
  summarySheet.getRow(6).font = { bold: true };

  // Encabezados de tabla resumen
  const summaryHeaders = summarySheet.addRow(['Categoría', 'Cantidad de Órdenes', 'Total en Ventas', 'Total en Anticipos']);
  summaryHeaders.font = { bold: true };
  summaryHeaders.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Datos de resumen
  summarySheet.addRow([
    'Hoy',
    data.todayOrders.length,
    formatCurrency(data.todayOrders.reduce((sum, order) => sum + order.total, 0)),
    formatCurrency(data.todayOrders.reduce((sum, order) => sum + (order.advance || 0), 0))
  ]);
  summarySheet.addRow([
    'Mañana',
    data.tomorrowOrders.length,
    formatCurrency(data.tomorrowOrders.reduce((sum, order) => sum + order.total, 0)),
    formatCurrency(data.tomorrowOrders.reduce((sum, order) => sum + (order.advance || 0), 0))
  ]);
  summarySheet.addRow([
    'Posteriores',
    data.laterOrders.length,
    formatCurrency(data.laterOrders.reduce((sum, order) => sum + order.total, 0)),
    formatCurrency(data.laterOrders.reduce((sum, order) => sum + (order.advance || 0), 0))
  ]);
  summarySheet.addRow([]);

  const totalRow = summarySheet.addRow([
    'TOTAL GENERAL',
    data.todayOrders.length + data.tomorrowOrders.length + data.laterOrders.length,
    formatCurrency(
      data.todayOrders.reduce((sum, order) => sum + order.total, 0) +
      data.tomorrowOrders.reduce((sum, order) => sum + order.total, 0) +
      data.laterOrders.reduce((sum, order) => sum + order.total, 0)
    ),
    formatCurrency(
      data.todayOrders.reduce((sum, order) => sum + (order.advance || 0), 0) +
      data.tomorrowOrders.reduce((sum, order) => sum + (order.advance || 0), 0) +
      data.laterOrders.reduce((sum, order) => sum + (order.advance || 0), 0)
    )
  ]);
  totalRow.font = { bold: true };

  // Crear hojas de órdenes
  const todaySheet = workbook.addWorksheet('Hoy');
  addOrdersToSheet(todaySheet, data.todayOrders, 'Hoy');

  const tomorrowSheet = workbook.addWorksheet('Mañana');
  addOrdersToSheet(tomorrowSheet, data.tomorrowOrders, 'Mañana');

  const laterSheet = workbook.addWorksheet('Posteriores');
  addOrdersToSheet(laterSheet, data.laterOrders, 'Posteriores');

  // Generar el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Crear enlace de descarga
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Reporte_Produccion_${currentDate}${branchName ? `_${branchName.replace(/\s+/g, '_')}` : ''}.xlsx`;

  // Simular click para descargar
  document.body.appendChild(link);
  link.click();

  // Limpiar
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
