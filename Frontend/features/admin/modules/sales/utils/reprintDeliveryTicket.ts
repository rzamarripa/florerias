import { toast } from "react-toastify";
import { companiesService } from "@/features/admin/modules/companies/services/companies";
import { generateDeliveryTicket, DeliveryTicketData } from "@/features/admin/modules/orders/utils/generateDeliveryTicket";
import { Sale } from "../types";

/**
 * Función para reimprimir un ticket de envío
 * Obtiene los datos de la orden, consulta la información de la empresa
 * y genera el ticket de envío de la misma manera que cuando se crea la orden
 */
export const reprintDeliveryTicket = async (sale: Sale) => {
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

    // Construir datos para el ticket de envío
    const deliveryTicketData: DeliveryTicketData = {
      order: {
        orderNumber: sale.orderNumber || sale._id,
        anonymous: sale.anonymous || false,
        clientInfo: {
          name: sale.clientInfo?.name || "Sin nombre",
          phone: sale.clientInfo?.phone || "",
        },
        deliveryData: {
          recipientName: sale.deliveryData?.recipientName || "N/A",
          deliveryDateTime: sale.deliveryData?.deliveryDateTime || "",
          street: sale.deliveryData?.street || "",
          neighborhoodName: sale.deliveryData?.neighborhood || "", // Map neighborhood to neighborhoodName
          reference: sale.deliveryData?.reference || "",
          message: sale.deliveryData?.message || "",
        },
        branchInfo: {
          city: companyResponse.data?.address?.city || "",
          state: companyResponse.data?.address?.state || "",
        },
      },
    };

    // Generar HTML del ticket
    const deliveryTicketHTML = generateDeliveryTicket(deliveryTicketData);

    // Crear ventana para imprimir
    const printWindow = window.open("", "_blank", "width=400,height=600");

    if (printWindow) {
      printWindow.document.write(deliveryTicketHTML);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 100);
      };

      toast.success("Ticket de envío listo para imprimir");
    } else {
      toast.error(
        "No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador."
      );
    }
  } catch (error) {
    console.error("Error al reimprimir ticket de envío:", error);
    toast.error("Error al generar el ticket de envío");
  }
};