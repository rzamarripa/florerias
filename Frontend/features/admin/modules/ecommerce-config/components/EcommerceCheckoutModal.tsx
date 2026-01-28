"use client";

import React, { useState, useEffect } from "react";
import OrderDetailsModal from "@/features/admin/modules/orders/components/OrderDetailsModal";
import QRScanner from "@/features/admin/modules/digitalCards/components/QRScanner";
import ClientPointsDashboardModal from "@/features/admin/modules/clients/components/ClientPointsDashboardModal";
import { useCartStore } from "../store/cartStore";
import { CreateOrderData, OrderItem } from "@/features/admin/modules/orders/types";
import { ordersService } from "@/features/admin/modules/orders/services/orders";
import { storageService } from "@/features/admin/modules/storage/services/storage";
import { toast } from "react-toastify";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface EcommerceCheckoutModalProps {
  show: boolean;
  onHide: () => void;
  branchId: string;
  onOrderCreated?: () => void; // Callback opcional para cuando se crea una orden exitosamente
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

  // Obtener almacén de la sucursal
  const fetchStorageByBranch = async (branchId: string) => {
    if (!branchId) return;
    
    setLoadingStorage(true);
    try {
      const response = await storageService.getStorageByBranch(branchId);
      if (response.data) {
        setStorageId(response.data._id);
      } else {
        console.warn("No se encontró almacén para la sucursal");
        setStorageId("");
      }
    } catch (err) {
      console.error("Error al cargar almacén:", err);
      setStorageId("");
    } finally {
      setLoadingStorage(false);
    }
  };

  // Cargar almacén cuando se abre el modal o cambia la sucursal
  useEffect(() => {
    if (show && branchId) {
      fetchStorageByBranch(branchId);
    }
  }, [show, branchId]);

  // Datos iniciales del formulario para e-commerce
  const [formData, setFormData] = useState<CreateOrderData>({
    branchId: branchId,
    cashRegisterId: null, // No hay caja para e-commerce
    clientInfo: {
      name: "",
      phone: "",
      email: "",
    },
    salesChannel: "tienda", // E-commerce se considera venta en tienda
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
    eOrder: true, // Marcar como orden de e-commerce
  });

  // Actualizar items y totales cuando se abre el modal o cambia el carrito
  useEffect(() => {
    if (show && cartItems.length > 0) {
      const orderItems = convertCartToOrderItems();
      // Calcular subtotal directamente desde los items del carrito
      const subtotal = cartItems.reduce((total, item) => total + (item.precio * item.quantity), 0);
      const totals = calculateTotals(subtotal, formData.discount, formData.discountType, formData.deliveryData.deliveryPrice);
      
      setFormData(prev => ({
        ...prev,
        items: orderItems,
        ...totals,
        eOrder: true, // Asegurar que siempre tenga eOrder: true
        branchId: branchId, // Actualizar branchId si cambió
      }));
    }
  }, [show, cartItems.length]); // Solo escuchar cambios en la cantidad de items, no en el array completo

  // Manejar cambio de descuento
  const handleDiscountChange = (value: number, tipo: "porcentaje" | "cantidad") => {
    // Calcular subtotal directamente desde los items del carrito
    const subtotal = cartItems.reduce((total, item) => total + (item.precio * item.quantity), 0);
    const totals = calculateTotals(subtotal, value, tipo, formData.deliveryData.deliveryPrice);
    
    setFormData(prev => ({
      ...prev,
      discount: value,
      discountType: tipo,
      ...totals,
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent, files: { comprobante: File | null; arreglo: File | null }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar que hay items en el carrito
      if (formData.items.length === 0) {
        throw new Error("El carrito está vacío");
      }

      // Validar que hay método de pago
      if (!formData.paymentMethod) {
        throw new Error("Debes seleccionar un método de pago");
      }

      // Crear la orden con eOrder: true
      const orderData = {
        ...formData,
        eOrder: true, // Asegurar que es orden de e-commerce
        cashRegisterId: null, // Sin caja registradora
        storageId: storageId || null, // Usar el almacén de la sucursal si existe
      };

      const response = await ordersService.createOrder(orderData);

      if (!response || !response.success) {
        throw new Error(response?.message || "Error al crear la orden");
      }

      toast.success(`¡Orden ${response.data.orderNumber || ""} creada exitosamente!`);
      setSuccess(true);
      
      // Limpiar carrito después de crear la orden exitosamente
      clearCart();
      
      // Llamar callback si existe para actualizar el catálogo
      if (onOrderCreated) {
        onOrderCreated();
      }
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onHide();
        setSuccess(false);
        // Resetear formulario
        const newSubtotal = 0; // Carrito vacío después de la compra
        const totals = calculateTotals(newSubtotal);
        setFormData(prev => ({
          ...prev,
          clientInfo: {
            name: "",
            phone: "",
            email: "",
          },
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
    // Cerrar el modal de detalles temporalmente
    // No cerrar el modal principal, solo abrir el scanner
    setShowQRScanner(true);
  };

  // Manejar éxito del escaneo QR
  const handleQRScanSuccess = (scanData: any) => {
    // Guardar los datos del cliente escaneado
    setScannedClientData(scanData);

    // Verificar si el cliente pertenece a la sucursal actual
    if (scanData && scanData.client) {
      const clientBranchId = scanData.client.branchId || scanData.client.branch;

      // Verificar que el cliente pertenezca a la misma sucursal
      if (clientBranchId && branchId && clientBranchId !== branchId) {
        toast.error("El cliente no corresponde a la sucursal actual");
        setShowQRScanner(false);
        return;
      }

      // Actualizar el formulario con los datos del cliente
      setFormData((prev) => ({
        ...prev,
        clientInfo: {
          clientId: scanData.client.id,
          name: scanData.client.fullName || `${scanData.client.name} ${scanData.client.lastName}`,
          phone: scanData.client.phoneNumber || "",
          email: scanData.client.email || "",
        },
      }));

      // Cerrar el scanner
      setShowQRScanner(false);

      // Abrir el dashboard de puntos después de un breve delay
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
        cashRegister={null} // No hay caja en e-commerce
        loadingCashRegister={false}
        isSocialMedia={false}
        isCashier={false}
        selectedStorageId={storageId} // Pasar el almacén de la sucursal
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
        onScanQR={handleScanQR} // Agregar función de escaneo QR
        isEcommerceOrder={true} // Indicar que es orden de e-commerce
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
            // No limpiar scannedClientData para mantener los datos del cliente
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
    </>
  );
};

export default EcommerceCheckoutModal;