"use client";

import React, { useState, useEffect } from "react";
import OrderDetailsModal from "@/features/admin/modules/orders/components/OrderDetailsModal";
import QRScanner from "@/features/admin/modules/digitalCards/components/QRScanner";
import ClientPointsDashboardModal from "@/features/admin/modules/clients/components/ClientPointsDashboardModal";
import WhatsAppTicketModal from "@/features/admin/modules/orders/components/WhatsAppTicketModal";
import { useCartStore } from "../store/cartStore";
import { CreateOrderData, OrderItem } from "@/features/admin/modules/orders/types";
import { ordersService } from "@/features/admin/modules/orders/services/orders";
import { storageService } from "@/features/admin/modules/storage/services/storage";
import { generateSaleTicket, SaleTicketData } from "@/features/admin/modules/orders/utils/generateSaleTicket";
import { generateDeliveryTicket, DeliveryTicketData } from "@/features/admin/modules/orders/utils/generateDeliveryTicket";
import { uploadSaleTicket, uploadDeliveryTicket } from "@/services/firebaseStorage";
import { convertHtmlToImage } from "@/utils/htmlToImage";
import { companiesService } from "@/features/admin/modules/companies/services/companies";
import { paymentMethodsService } from "@/features/admin/modules/payment-methods/services/paymentMethods";
import { PaymentMethod } from "@/features/admin/modules/payment-methods/types";
import { createTicket } from "@/features/admin/modules/orders/services/tickets";
import { toast } from "react-toastify";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface EcommerceCheckoutModalProps {
  show: boolean;
  onHide: () => void;
  branchId: string;
  onOrderCreated?: () => void;
}

const EcommerceCheckoutModal: React.FC<EcommerceCheckoutModalProps> = ({
  show,
  onHide,
  branchId,
  onOrderCreated,
}) => {
  const { user } = useUserSessionStore();
  const { items: cartItems, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [storageId, setStorageId] = useState<string>("");
  const [loadingStorage, setLoadingStorage] = useState(false);

  // Estados para QR Scanner
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPointsDashboard, setShowPointsDashboard] = useState(false);
  const [scannedClientData, setScannedClientData] = useState<any>(null);

  // Estados para tickets y WhatsApp
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppTicketData, setWhatsAppTicketData] = useState<{
    orderNumber: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    saleTicketUrl?: string;
    deliveryDriverName?: string;
    deliveryDriverPhone?: string;
    deliveryTicketUrl?: string;
    companyName: string;
  } | null>(null);

  // Convertir items del carrito al formato de OrderItem
  const convertCartToOrderItems = (): OrderItem[] => {
    return cartItems.map(item => ({
      isProduct: true,
      productId: item._id,
      productName: item.nombre,
      quantity: item.quantity,
      unitPrice: item.precio,
      amount: item.precio * item.quantity,
      productCategory: item.productCategory || null,
      insumos: [],
    }));
  };

  // Calcular totales
  const calculateTotals = (subtotal: number, discount: number = 0, discountType: "porcentaje" | "cantidad" = "porcentaje", deliveryPrice: number = 0) => {
    const discountAmount = discountType === "porcentaje"
      ? (subtotal * discount) / 100
      : discount;
    const total = subtotal - discountAmount + deliveryPrice;

    return {
      subtotal,
      total,
      remainingBalance: total,
    };
  };

  // Obtener almacen de la sucursal
  const fetchStorageByBranch = async (branchId: string) => {
    if (!branchId) return;

    setLoadingStorage(true);
    try {
      const response = await storageService.getStorageByBranch(branchId);
      if (response.data) {
        setStorageId(response.data._id);
      } else {
        console.warn("No se encontro almacen para la sucursal");
        setStorageId("");
      }
    } catch (err) {
      console.error("Error al cargar almacen:", err);
      setStorageId("");
    } finally {
      setLoadingStorage(false);
    }
  };

  // Obtener metodos de pago (necesario para datos del ticket)
  const fetchPaymentMethods = async () => {
    try {
      const response = await paymentMethodsService.getAllPaymentMethods({
        limit: 1000,
        status: true,
      });
      setPaymentMethods(response.data);
    } catch (err) {
      console.error("Error al cargar metodos de pago:", err);
    }
  };

  // Cargar almacen y metodos de pago cuando se abre el modal
  useEffect(() => {
    if (show && branchId) {
      fetchStorageByBranch(branchId);
      fetchPaymentMethods();
    }
  }, [show, branchId]);

  // Datos iniciales del formulario para e-commerce
  const [formData, setFormData] = useState<CreateOrderData>({
    branchId: branchId,
    cashRegisterId: null,
    clientInfo: {
      name: "",
      phone: "",
      email: "",
    },
    salesChannelId: "", // Se auto-selecciona en OrderDetailsModal
    items: [],
    shippingType: "tienda",
    anonymous: false,
    quickSale: false,
    deliveryData: {
      recipientName: "",
      deliveryDateTime: "",
      message: "",
      street: "",
      neighborhoodId: "",
      deliveryPrice: 0,
      reference: "",
    },
    paymentMethod: "",
    discount: 0,
    discountType: "porcentaje",
    subtotal: 0,
    total: 0,
    advance: 0,
    paidWith: 0,
    change: 0,
    remainingBalance: 0,
    sendToProduction: false,
    isSocialMediaOrder: false,
    socialMedia: null,
    eOrder: true,
  });

  // Actualizar items y totales cuando se abre el modal o cambia el carrito
  useEffect(() => {
    if (show && cartItems.length > 0) {
      const orderItems = convertCartToOrderItems();
      const subtotal = cartItems.reduce((total, item) => total + (item.precio * item.quantity), 0);
      const totals = calculateTotals(subtotal, formData.discount, formData.discountType, formData.deliveryData.deliveryPrice);

      setFormData(prev => ({
        ...prev,
        items: orderItems,
        ...totals,
        eOrder: true,
        branchId: branchId,
      }));
    }
  }, [show, cartItems.length]);

  // Manejar cambio de descuento
  const handleDiscountChange = (value: number, tipo: "porcentaje" | "cantidad") => {
    const subtotal = cartItems.reduce((total, item) => total + (item.precio * item.quantity), 0);
    const totals = calculateTotals(subtotal, value, tipo, formData.deliveryData.deliveryPrice);

    setFormData(prev => ({
      ...prev,
      discount: value,
      discountType: tipo,
      ...totals,
    }));
  };

  // Generar e imprimir ticket de venta
  const generateAndPrintSaleTicket = async (orderData: any) => {
    if (!user) {
      console.error("No hay usuario logueado");
      return;
    }

    try {
      // Obtener datos de la empresa/sucursal
      const companyResponse = await companiesService.getCompanyByBranchId(
        orderData.branchId._id || orderData.branchId
      );

      if (!companyResponse.success || !companyResponse.data) {
        throw new Error("No se pudieron obtener los datos de la empresa");
      }

      const companyId = companyResponse.data.companyId;
      const orderBranchId = typeof orderData.branchId === "string"
        ? orderData.branchId
        : orderData.branchId._id;
      const orderId = orderData._id;

      // Buscar el metodo de pago seleccionado para obtener su nombre
      const selectedPaymentMethod = paymentMethods.find(
        (pm) =>
          pm._id ===
          (typeof orderData.paymentMethod === "string"
            ? orderData.paymentMethod
            : orderData.paymentMethod._id)
      );

      // Construir datos para el ticket
      const ticketData: SaleTicketData = {
        order: {
          orderNumber: orderData.orderNumber,
          createdAt: orderData.createdAt,
          anonymous: orderData.anonymous || false,
          clientInfo: {
            name: orderData.clientInfo.name,
            phone: orderData.clientInfo.phone || "",
          },
          deliveryData: {
            recipientName: orderData.deliveryData.recipientName,
            deliveryDateTime: orderData.deliveryData.deliveryDateTime,
            message: orderData.deliveryData.message || "",
            street: orderData.deliveryData.street,
            reference: orderData.deliveryData.reference,
          },
          items: orderData.items.map((item: any) => ({
            quantity: item.quantity,
            productName: item.productName,
            amount: item.amount,
          })),
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          discountType: orderData.discountType,
          total: orderData.total,
          advance: orderData.advance,
          remainingBalance: orderData.remainingBalance,
          shippingType: orderData.shippingType,
          deliveryPrice: orderData.deliveryData?.deliveryPrice || 0,
          paymentMethod: selectedPaymentMethod?.name || "N/A",
        },
        company: companyResponse.data,
        cashier: {
          fullName: user.profile?.fullName || "E-commerce",
        },
        payments: orderData.payments || [],
      };

      // Generar HTML del ticket
      const ticketHTML = generateSaleTicket(ticketData);

      // Variables para guardar las URLs de los tickets
      let saleTicketUrl: string | null = null;
      let saleTicketPath: string | null = null;
      let deliveryTicketUrl: string | null = null;
      let deliveryTicketPath: string | null = null;

      // Subir ticket de venta a Firebase y guardar en base de datos
      try {
        if (!companyId || !orderBranchId || !orderId) {
          throw new Error("IDs faltantes para subir ticket");
        }

        // Convertir HTML a imagen PNG (mismo proceso que el ticket de envío)
        const saleTicketBlob = await convertHtmlToImage(ticketHTML, {
          width: 500,
          backgroundColor: 'white'
        });

        const saleTicketResult = await uploadSaleTicket(
          saleTicketBlob,
          companyId,
          orderBranchId,
          orderId
        );
        saleTicketUrl = saleTicketResult.url;
        saleTicketPath = saleTicketResult.path;

        // Guardar ticket de venta en la base de datos
        await createTicket({
          orderId,
          branchId: orderBranchId,
          url: saleTicketUrl,
          path: saleTicketPath,
          isStoreTicket: true,
        });
      } catch (uploadError: any) {
        console.error("Error al subir ticket de venta:", uploadError);
        toast.warning("No se pudo guardar el ticket en la nube, pero se genero correctamente para imprimir");
      }

      // Crear ventana para imprimir
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (printWindow) {
        printWindow.document.write(ticketHTML);
        printWindow.document.close();

        printWindow.onload = () => {
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 100);
        };
      } else {
        toast.error(
          "No se pudo abrir la ventana de impresion. Verifica que no este bloqueada por el navegador."
        );
      }

      // Si es una orden de tipo envio, generar tambien el ticket de delivery
      if (orderData.shippingType === "envio") {
        try {
          const deliveryTicketData: DeliveryTicketData = {
            order: {
              orderNumber: orderData.orderNumber,
              anonymous: orderData.anonymous || false,
              clientInfo: {
                name: orderData.clientInfo.name,
                phone: orderData.clientInfo.phone || "",
              },
              deliveryData: {
                recipientName: orderData.deliveryData.recipientName,
                deliveryDateTime: orderData.deliveryData.deliveryDateTime,
                street: orderData.deliveryData.street || "",
                neighborhoodName: orderData.deliveryData.neighborhoodId?.name || "",
                reference: orderData.deliveryData.reference || "",
                message: orderData.deliveryData.message || "",
              },
              branchInfo: {
                city: orderData.branchId?.city || companyResponse.data?.address?.city || "",
                state: orderData.branchId?.state || companyResponse.data?.address?.state || "",
              },
            },
          };

          // Generar HTML del ticket de delivery
          const deliveryTicketHTML = generateDeliveryTicket(deliveryTicketData);

          // Convertir HTML a imagen
          const deliveryTicketBlob = await convertHtmlToImage(deliveryTicketHTML, {
            width: 500,
            backgroundColor: "white",
          });

          // Subir ticket de envio a Firebase y guardar en base de datos
          try {
            const deliveryTicketResult = await uploadDeliveryTicket(
              deliveryTicketBlob,
              companyId,
              orderBranchId,
              orderId
            );
            deliveryTicketUrl = deliveryTicketResult.url;
            deliveryTicketPath = deliveryTicketResult.path;

            // Guardar ticket de envio en la base de datos
            await createTicket({
              orderId,
              branchId: orderBranchId,
              url: deliveryTicketUrl,
              path: deliveryTicketPath,
              isStoreTicket: false,
            });
          } catch (uploadError: any) {
            console.error("Error al subir ticket de envio:", uploadError);
          }

          // Crear ventana para imprimir ticket de delivery
          setTimeout(() => {
            const deliveryPrintWindow = window.open("", "_blank", "width=400,height=600");

            if (deliveryPrintWindow) {
              deliveryPrintWindow.document.write(deliveryTicketHTML);
              deliveryPrintWindow.document.close();

              deliveryPrintWindow.onload = () => {
                deliveryPrintWindow.focus();
                setTimeout(() => {
                  deliveryPrintWindow.print();
                }, 100);
              };
            } else {
              toast.warning(
                "No se pudo abrir la ventana para el ticket de entrega. Verifica los popups del navegador."
              );
            }
          }, 1500);
        } catch (deliveryError) {
          console.error("Error generando ticket de delivery:", deliveryError);
        }
      }

      // Verificar si se puede enviar por WhatsApp
      const hasWhatsAppData = (orderData.clientInfo.phone && saleTicketUrl) ||
                             (orderData.deliveryDriverDetails && deliveryTicketUrl);

      if (hasWhatsAppData) {
        setWhatsAppTicketData({
          orderNumber: orderData.orderNumber,
          clientName: orderData.clientInfo.name,
          clientPhone: orderData.clientInfo.phone,
          clientEmail: orderData.clientInfo.email || undefined,
          saleTicketUrl: saleTicketUrl || undefined,
          deliveryDriverName: orderData.deliveryDriverDetails?.name,
          deliveryDriverPhone: orderData.deliveryDriverDetails?.phone,
          deliveryTicketUrl: deliveryTicketUrl || undefined,
          companyName: companyResponse.data.companyName,
        });
        setShowWhatsAppModal(true);
      }
    } catch (error) {
      console.error("Error generando ticket de venta:", error);
      toast.error("Error al generar el ticket de venta");
    }
  };

  // Manejar envio del formulario
  const handleSubmit = async (e: React.FormEvent, files: { comprobante: File | null; arreglo: File | null }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar que hay items en el carrito
      if (formData.items.length === 0) {
        throw new Error("El carrito esta vacio");
      }

      // Validar que hay metodo de pago
      if (!formData.paymentMethod) {
        throw new Error("Debes seleccionar un metodo de pago");
      }

      // Crear la orden con eOrder: true
      const orderData = {
        ...formData,
        eOrder: true,
        cashRegisterId: null,
        storageId: storageId || null,
      };

      const response = await ordersService.createOrder(orderData);

      if (!response || !response.success) {
        throw new Error(response?.message || "Error al crear la orden");
      }

      toast.success(`Orden ${response.data.orderNumber || ""} creada exitosamente!`);

      // Generar e imprimir ticket de venta
      generateAndPrintSaleTicket(response.data);

      setSuccess(true);

      // Limpiar carrito despues de crear la orden exitosamente
      clearCart();

      // Llamar callback si existe para actualizar el catalogo
      if (onOrderCreated) {
        onOrderCreated();
      }

      // Cerrar modal despues de 2 segundos
      setTimeout(() => {
        onHide();
        setSuccess(false);
        // Resetear formulario
        const newSubtotal = 0;
        const totals = calculateTotals(newSubtotal);
        setFormData(prev => ({
          ...prev,
          clientInfo: {
            name: "",
            phone: "",
            email: "",
          },
          salesChannelId: "",
          items: [],
          discount: 0,
          discountType: "porcentaje",
          ...totals,
          advance: 0,
          paidWith: 0,
          change: 0,
          deliveryData: {
            recipientName: "",
            deliveryDateTime: "",
            message: "",
            street: "",
            neighborhoodId: "",
            deliveryPrice: 0,
            reference: "",
          },
        }));
      }, 2000);

    } catch (err: any) {
      const errorMessage = err.message || "Error al crear el pedido";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manejar apertura del scanner QR
  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  // Manejar exito del escaneo QR
  const handleQRScanSuccess = (scanData: any) => {
    setScannedClientData(scanData);

    if (scanData && scanData.client) {
      const clientBranchId = scanData.client.branchId || scanData.client.branch;

      if (clientBranchId && branchId && clientBranchId !== branchId) {
        toast.error("El cliente no corresponde a la sucursal actual");
        setShowQRScanner(false);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        clientInfo: {
          clientId: scanData.client.id,
          name: scanData.client.fullName || `${scanData.client.name} ${scanData.client.lastName}`,
          phone: scanData.client.phoneNumber || "",
          email: scanData.client.email || "",
        },
      }));

      setShowQRScanner(false);

      setTimeout(() => {
        setShowPointsDashboard(true);
      }, 500);

      toast.success(`Cliente ${scanData.client.fullName} identificado correctamente`);
    }
  };

  if (!show) return null;

  return (
    <>
      <OrderDetailsModal
        show={show}
        onHide={onHide}
        formData={formData}
        setFormData={setFormData}
        cashRegister={null}
        loadingCashRegister={false}
        isSocialMedia={false}
        isCashier={false}
        selectedStorageId={storageId}
        hasPendingDiscountAuth={false}
        loading={loading}
        uploadingFiles={false}
        error={error}
        success={success}
        scannedClientId={scannedClientData?.client?.id || null}
        onDiscountChange={handleDiscountChange}
        onSubmit={handleSubmit}
        onShowDiscountRequestDialog={() => {}}
        onCancelDiscount={() => {
          handleDiscountChange(0, "porcentaje");
        }}
        setError={setError}
        setSuccess={setSuccess}
        onScanQR={handleScanQR}
        isEcommerceOrder={true}
      />

      {/* Modal de QR Scanner */}
      <QRScanner
        show={showQRScanner}
        onHide={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScanSuccess}
        branchId={branchId}
      />

      {/* Modal del Dashboard de Puntos */}
      {scannedClientData && (
        <ClientPointsDashboardModal
          show={showPointsDashboard}
          onHide={() => {
            setShowPointsDashboard(false);
          }}
          client={{
            _id: scannedClientData.client.id,
            name: scannedClientData.client.name,
            lastName: scannedClientData.client.lastName,
            clientNumber: scannedClientData.client.clientNumber,
            phoneNumber: scannedClientData.client.phoneNumber,
            email: scannedClientData.client.email,
            points: scannedClientData.client.points,
            status: scannedClientData.client.status,
          }}
          branchId={branchId}
        />
      )}

      {/* Modal de WhatsApp para enviar ticket */}
      {whatsAppTicketData && (
        <WhatsAppTicketModal
          isOpen={showWhatsAppModal}
          onClose={() => {
            setShowWhatsAppModal(false);
            setWhatsAppTicketData(null);
          }}
          orderNumber={whatsAppTicketData.orderNumber}
          clientName={whatsAppTicketData.clientName}
          clientPhone={whatsAppTicketData.clientPhone}
          clientEmail={whatsAppTicketData.clientEmail}
          saleTicketUrl={whatsAppTicketData.saleTicketUrl}
          deliveryDriverName={whatsAppTicketData.deliveryDriverName}
          deliveryDriverPhone={whatsAppTicketData.deliveryDriverPhone}
          deliveryTicketUrl={whatsAppTicketData.deliveryTicketUrl}
          companyName={whatsAppTicketData.companyName}
          onSuccess={() => {
            console.log("Tickets enviados por WhatsApp exitosamente");
          }}
        />
      )}
    </>
  );
};

export default EcommerceCheckoutModal;
