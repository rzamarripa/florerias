import * as XLSX from 'xlsx';

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

// Función para convertir órdenes a formato de hoja de cálculo
const ordersToSheetData = (orders: Order[], sheetTitle: string) => {
  // Encabezados
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

  // Datos
  const data = orders.map(order => {
    const { date, time } = formatDateTime(order.deliveryData.deliveryDateTime);
    const createdDate = formatDateTime(order.createdAt).date;
    
    // Concatenar nombres de productos con cantidades
    const productsList = order.items
      .map(item => `${item.productName} (x${item.quantity})`)
      .join(', ');

    return [
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
    ];
  });

  // Combinar encabezados y datos
  return [headers, ...data];
};

// Función principal para generar el archivo Excel
export const generateProductionExcelReport = (data: ProductionOrdersData, branchName?: string) => {
  // Crear un nuevo libro
  const workbook = XLSX.utils.book_new();

  // Obtener fecha actual para el nombre del archivo
  const currentDate = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');

  // Definir anchos de columna estándar
  const columnWidths = [
    { wch: 12 }, // No. Orden
    { wch: 25 }, // Cliente
    { wch: 15 }, // Teléfono
    { wch: 25 }, // Destinatario
    { wch: 12 }, // Fecha Entrega
    { wch: 12 }, // Hora Entrega
    { wch: 50 }, // Productos
    { wch: 15 }, // Canal de Venta
    { wch: 20 }, // Tipo de Entrega
    { wch: 30 }, // Dirección
    { wch: 25 }, // Referencia
    { wch: 30 }, // Mensaje
    { wch: 12 }, // Total
    { wch: 12 }, // Anticipo
    { wch: 15 }, // Saldo Pendiente
    { wch: 12 }, // Estado
    { wch: 12 }, // En Producción
    { wch: 20 }, // Sucursal
    { wch: 12 }  // Fecha Creación
  ];

  // Crear hoja para órdenes de Hoy (siempre crear aunque esté vacía)
  const todaySheetData = data.todayOrders.length > 0 
    ? ordersToSheetData(data.todayOrders, 'Hoy')
    : [['No hay órdenes programadas para hoy']];
  const todaySheet = XLSX.utils.aoa_to_sheet(todaySheetData);
  todaySheet['!cols'] = columnWidths;
  XLSX.utils.book_append_sheet(workbook, todaySheet, 'Hoy');

  // Crear hoja para órdenes de Mañana (siempre crear aunque esté vacía)
  const tomorrowSheetData = data.tomorrowOrders.length > 0 
    ? ordersToSheetData(data.tomorrowOrders, 'Mañana')
    : [['No hay órdenes programadas para mañana']];
  const tomorrowSheet = XLSX.utils.aoa_to_sheet(tomorrowSheetData);
  tomorrowSheet['!cols'] = columnWidths;
  XLSX.utils.book_append_sheet(workbook, tomorrowSheet, 'Mañana');

  // Crear hoja para órdenes Posteriores (siempre crear aunque esté vacía)
  const laterSheetData = data.laterOrders.length > 0 
    ? ordersToSheetData(data.laterOrders, 'Posteriores')
    : [['No hay órdenes posteriores programadas']];
  const laterSheet = XLSX.utils.aoa_to_sheet(laterSheetData);
  laterSheet['!cols'] = columnWidths;
  XLSX.utils.book_append_sheet(workbook, laterSheet, 'Posteriores');

  // Crear hoja de resumen
  const summaryData = [
    ['REPORTE DE PRODUCCIÓN'],
    [''],
    ['Fecha de generación:', currentDate],
    ['Sucursal:', branchName || 'Todas las sucursales'],
    [''],
    ['RESUMEN'],
    ['Categoría', 'Cantidad de Órdenes', 'Total en Ventas', 'Total en Anticipos'],
    [
      'Hoy', 
      data.todayOrders.length,
      formatCurrency(data.todayOrders.reduce((sum, order) => sum + order.total, 0)),
      formatCurrency(data.todayOrders.reduce((sum, order) => sum + (order.advance || 0), 0))
    ],
    [
      'Mañana', 
      data.tomorrowOrders.length,
      formatCurrency(data.tomorrowOrders.reduce((sum, order) => sum + order.total, 0)),
      formatCurrency(data.tomorrowOrders.reduce((sum, order) => sum + (order.advance || 0), 0))
    ],
    [
      'Posteriores', 
      data.laterOrders.length,
      formatCurrency(data.laterOrders.reduce((sum, order) => sum + order.total, 0)),
      formatCurrency(data.laterOrders.reduce((sum, order) => sum + (order.advance || 0), 0))
    ],
    [''],
    [
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
    ]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Ajustar anchos de columna para resumen
  summarySheet['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 }
  ];
  
  // Insertar la hoja de resumen al principio
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Generar el archivo
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
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