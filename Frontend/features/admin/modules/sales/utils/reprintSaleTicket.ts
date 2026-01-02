import { toast } from "react-toastify";
import { companiesService } from "@/features/admin/modules/companies/services/companies";
import { generateSaleTicket, SaleTicketData } from "@/features/admin/modules/orders/utils/generateSaleTicket";
import { Sale } from "../types";

/**
 * Función para reimprimir un ticket de venta
 * Obtiene los datos de la orden, consulta la información de la empresa
 * y genera el ticket de la misma manera que cuando se crea la orden
 */
export const reprintSaleTicket = async (
  sale: Sale,
  currentUserFullName?: string
) => {
  try {
    // Validar que la venta tenga los datos necesarios
    if (!sale.branchId) {
      toast.error("La venta no tiene sucursal asociada");
      return;
    }

    // Obtener datos de la empresa/sucursal
    const branchId = typeof sale.branchId === 'string'
      ? sale.branchId
      : sale.branchId._id;

    const companyResponse = await companiesService.getCompanyByBranchId(branchId);

    if (!companyResponse.success || !companyResponse.data) {
      throw new Error("No se pudieron obtener los datos de la empresa");
    }

    // Construir datos para el ticket
    const ticketData: SaleTicketData = {
      order: {
        orderNumber: sale.orderNumber || sale._id,
        createdAt: sale.createdAt,
        clientInfo: {
          name: sale.clientInfo?.name || "Sin nombre",
          phone: sale.clientInfo?.phone || "",
        },
        deliveryData: {
          recipientName: sale.deliveryData?.recipientName || "N/A",
          deliveryDateTime: sale.deliveryData?.deliveryDateTime || "",
          message: sale.deliveryData?.message || "",
          street: sale.deliveryData?.street || "",
          reference: sale.deliveryData?.reference || "",
        },
        items: (sale.items || []).map((item: any) => ({
          quantity: item.quantity,
          productName: item.productName || "Producto sin nombre",
          amount: item.amount,
        })),
        subtotal: sale.subtotal || 0,
        discount: sale.discount || 0,
        discountType: sale.discountType || "porcentaje",
        total: sale.total || 0,
        advance: sale.advance || 0,
        remainingBalance: sale.remainingBalance || 0,
        shippingType: sale.shippingType || "tienda",
        deliveryPrice: sale.deliveryData?.deliveryPrice || 0,
        paymentMethod: typeof sale.paymentMethod === 'string'
          ? sale.paymentMethod
          : sale.paymentMethod?.name || "N/A",
      },
      company: companyResponse.data,
      cashier: {
        fullName: currentUserFullName ||
                 (typeof sale.cashier === 'object' && sale.cashier?.name) ||
                 "Cajero",
      },
      payments: sale.payments || [],
    };

    // Generar HTML del ticket
    const ticketHTML = generateSaleTicket(ticketData);

    // Crear ventana para imprimir
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (printWindow) {
      printWindow.document.write(ticketHTML);
      printWindow.document.close();

      // Esperar a que se cargue el contenido
      printWindow.onload = () => {
        printWindow.focus();
      };

      toast.success("Ticket listo para imprimir");
    } else {
      toast.error(
        "No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador."
      );
    }
  } catch (error) {
    console.error("Error al reimprimir ticket:", error);
    toast.error("Error al generar el ticket de venta");
  }
};
