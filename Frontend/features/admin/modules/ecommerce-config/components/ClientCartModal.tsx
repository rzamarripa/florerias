import React, { useState, useEffect } from "react";
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Loader2,
  ArrowRight,
  CreditCard,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "../store/cartStore";
import { toast } from "react-toastify";
import OrderDetailsModal from "@/features/admin/modules/orders/components/OrderDetailsModal";
import QRScanner from "@/features/admin/modules/digitalCards/components/QRScanner";
import ClientPointsDashboardModal from "@/features/admin/modules/clients/components/ClientPointsDashboardModal";
import { CreateOrderData, OrderItem } from "@/features/admin/modules/orders/types";
import { PaymentMethod } from "@/features/admin/modules/payment-methods/types";
import { Branch } from "@/features/admin/modules/branches/types";
import { CashRegister } from "@/features/admin/modules/cash-registers/types";
import { Storage } from "@/features/admin/modules/storage/types";
import { paymentMethodsService } from "@/features/admin/modules/payment-methods/services/paymentMethods";
import { branchesService } from "@/features/admin/modules/branches/services/branches";
import { cashRegistersService } from "@/features/admin/modules/cash-registers/services/cashRegisters";
import { storageService } from "@/features/admin/modules/storage/services/storage";
import { ordersService } from "@/features/admin/modules/orders/services/orders";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { generateSaleTicket } from "@/features/admin/modules/orders/utils/generateSaleTicket";
import { uploadComprobante, uploadArreglo } from "@/services/firebaseStorage";
import { companiesService } from "@/features/admin/modules/companies/services/companies";
import DiscountAuthModal from "@/features/admin/modules/orders/components/DiscountAuthModal";
import { ecommerceConfigService } from "../services/ecommerceConfig";

interface ClientCartModalProps {
  colors?: any;
  typography?: any;
  onCheckout?: () => void;
}

const ClientCartModal: React.FC<ClientCartModalProps> = ({
  colors,
  typography,
  onCheckout,
}) => {
  const [processingOrder, setProcessingOrder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  
  // Estados para OrderDetailsModal
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [loadingCashRegister, setLoadingCashRegister] = useState(false);
  const [storage, setStorage] = useState<Storage | null>(null);
  const [selectedStorageId, setSelectedStorageId] = useState<string>("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showDiscountRequestDialog, setShowDiscountRequestDialog] = useState(false);
  const [discountRequestMessage, setDiscountRequestMessage] = useState("");
  const [hasPendingDiscountAuth, setHasPendingDiscountAuth] = useState(false);
  const [branchId, setBranchId] = useState<string>("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showPointsDashboard, setShowPointsDashboard] = useState(false);
  const [scannedClientData, setScannedClientData] = useState<any>(null);

  const { user } = useUserSessionStore();
  const { getIsCashier, getIsSocialMedia } = useUserRoleStore();
  const isCashier = getIsCashier();
  const isSocialMedia = getIsSocialMedia();

  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getAvailableStock,
  } = useCartStore();

  const subtotal = getTotalPrice();
  const total = subtotal; // Sin descuentos aquí, OrderDetailsModal los maneja

  // Cargar datos necesarios para OrderDetailsModal
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Cargar métodos de pago
      const paymentMethodsResponse = await paymentMethodsService.getAllPaymentMethods({ status: true });
      setPaymentMethods(paymentMethodsResponse.data || []);

      // Cargar configuración de ecommerce para obtener el branch
      const configResponse = await ecommerceConfigService.getManagerConfig();
      if (configResponse.data && configResponse.data.branch) {
        const branchData = configResponse.data.branch;
        const loadedBranchId = branchData._id || branchData;
        setBranchId(loadedBranchId);
        
        // Update formData with loaded branchId
        setFormData(prev => ({ ...prev, branchId: loadedBranchId }));
        
        // Cargar caja registradora del usuario
        if (user?.id) {
          const cashRegisterResponse = await cashRegistersService.getCashRegisterByUserId(user.id);
          if (cashRegisterResponse.success && cashRegisterResponse.data) {
            setCashRegister(cashRegisterResponse.data);
          }
        }

        // Cargar storage de la sucursal
        const storageResponse = await storageService.getStorageByBranch(branchData._id || branchData);
        if (storageResponse.success && storageResponse.data) {
          setStorage(storageResponse.data);
          setSelectedStorageId(storageResponse.data._id);
        }
      }
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
    }
  };

  // Preparar formData para OrderDetailsModal
  const [formData, setFormData] = useState<CreateOrderData>({
    branchId: "",
    cashRegisterId: null,
    clientInfo: {
      name: "",
      phone: "",
      email: "",
    },
    salesChannel: "tienda",
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
    eOrder: true, // Marcar como orden de e-commerce
  });

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const availableStock = getAvailableStock(productId);
    const currentItem = items.find(item => item._id === productId);
    const currentQuantity = currentItem?.quantity || 0;
    const maxQuantity = availableStock + currentQuantity;

    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else if (newQuantity > maxQuantity) {
      toast.error(`Solo hay ${maxQuantity} unidades disponibles`);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    // Si hay una función onCheckout proporcionada, úsala
    if (onCheckout) {
      closeCart(); // Cerrar el carrito primero
      onCheckout(); // Llamar a la función de checkout
      return;
    }

    // Si no, usar la lógica existente
    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    // Convertir items del carrito a formato OrderItem
    const orderItems: OrderItem[] = items.map(item => ({
      isProduct: true,
      productId: item._id,
      productName: item.nombre,
      quantity: item.quantity,
      unitPrice: item.precio,
      amount: item.precio * item.quantity,
      productCategory: item.productCategory || null,
      insumos: [], // Los insumos se manejan en el backend
    }));

    // Actualizar formData con los datos del carrito
    setFormData(prev => ({
      ...prev,
      branchId: branchId,
      cashRegisterId: cashRegister?._id || null,
      storageId: selectedStorageId || null,
      items: orderItems,
      subtotal: subtotal,
      total: total,
      paidWith: total,
      remainingBalance: 0,
      eOrder: true, // Asegurar que es una orden de e-commerce
    }));

    // Abrir el modal de detalles de orden
    setShowOrderDetailsModal(true);
  };

  const handleSubmitWithFiles = async (
    e: React.FormEvent,
    files: { comprobante: File | null; arreglo: File | null }
  ) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones básicas
      if (formData.items.length === 0) {
        throw new Error("Debes agregar al menos un producto");
      }

      // Si hay caja registradora, validar que esté abierta
      if (cashRegister && !cashRegister.isOpen) {
        throw new Error("La caja registradora debe estar abierta para crear órdenes");
      }

      // Subir archivos si existen
      let comprobanteUrl: string | null = null;
      let comprobantePath: string | null = null;
      let arregloUrl: string | null = null;
      let arregloPath: string | null = null;

      if (files.comprobante || files.arreglo) {
        setUploadingFiles(true);
        
        if (files.comprobante) {
          const comprobanteResult = await uploadComprobante(files.comprobante);
          comprobanteUrl = comprobanteResult.url;
          comprobantePath = comprobanteResult.path;
        }

        if (files.arreglo) {
          const arregloResult = await uploadArreglo(files.arreglo);
          arregloUrl = arregloResult.url;
          arregloPath = arregloResult.path;
        }
        
        setUploadingFiles(false);
      }

      // Crear la orden
      const orderData = {
        ...formData,
        comprobanteUrl,
        comprobantePath,
        arregloUrl,
        arregloPath,
        salesChannel: "tienda" as const,
        eOrder: true, // Marcar como orden de e-commerce
        hasPendingDiscountAuth,
        discountRequestMessage: discountRequestMessage || null,
      };

      const response = await ordersService.createOrder(orderData);

      if (!response || !response.success) {
        throw new Error(response?.message || "Error al crear la orden");
      }

      // Generar ticket si es necesario
      if (response.data) {
        try {
          const companyResponse = await companiesService.getCompanyByBranchId(formData.branchId);
          const companyData = companyResponse?.data;

          await generateSaleTicket({
            orderNumber: response.data.orderNumber || "",
            branchName: response.data.branch?.branchName || "",
            cashierName: user?.name || "",
            items: formData.items,
            subtotal: formData.subtotal,
            discount: formData.discount || 0,
            total: formData.total,
            paidWith: formData.paidWith || 0,
            change: formData.change || 0,
            paymentMethodName: paymentMethods.find(pm => pm._id === formData.paymentMethod)?.name || "",
            advance: formData.advance || 0,
            remainingBalance: formData.remainingBalance || 0,
            clientName: formData.clientInfo?.name || "",
            recipientName: formData.deliveryData?.recipientName || "",
            deliveryDate: formData.deliveryData?.deliveryDateTime || "",
            deliveryMessage: formData.deliveryData?.message || "",
            companyData,
          });
        } catch (ticketError) {
          console.error("Error generando ticket:", ticketError);
        }
      }

      toast.success("¡Orden creada exitosamente!");
      setSuccess(true);
      clearCart(); // Limpiar carrito después de crear la orden
      setShowOrderDetailsModal(false);
      closeCart();

    } catch (error: any) {
      console.error("Error al crear orden:", error);
      setError(error.message || "Error al crear la orden");
      toast.error(error.message || "Error al crear la orden");
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  const handleDiscountChange = (value: number, tipo: "porcentaje" | "cantidad") => {
    setFormData(prev => ({
      ...prev,
      discount: value,
      discountType: tipo,
      total: tipo === "porcentaje" 
        ? prev.subtotal - (prev.subtotal * value / 100)
        : prev.subtotal - value
    }));
  };

  const handleCancelDiscount = () => {
    setFormData(prev => ({
      ...prev,
      discount: 0,
      discountType: "porcentaje",
      total: prev.subtotal
    }));
    setHasPendingDiscountAuth(false);
    setDiscountRequestMessage("");
  };

  const handleQRScanSuccess = (scanData: any) => {
    // Guardar los datos del cliente escaneado
    setScannedClientData(scanData);
    
    // Verificar si el cliente pertenece a la sucursal actual
    if (scanData && scanData.client) {
      // Obtener la sucursal del cliente
      const clientBranchId = scanData.client.branchId || scanData.client.branch;
      // Obtener la sucursal actual
      const currentBranchId = branchId;
      
      // Verificar que el cliente pertenezca a la misma sucursal (si aplica)
      if (clientBranchId && currentBranchId && clientBranchId !== currentBranchId) {
        toast.error("El cliente no corresponde a la sucursal actual");
        // No actualizar el formulario si el cliente no es de la misma sucursal
        setShowQrScanner(false);
        setTimeout(() => {
          setShowOrderDetailsModal(true);
        }, 100);
        return;
      }
      
      // Si pasa la validación, actualizar el formulario con los datos del cliente
      setFormData((prev) => ({
        ...prev,
        clientInfo: {
          clientId: scanData.client.id,
          name: scanData.client.fullName || `${scanData.client.name} ${scanData.client.lastName}`,
          phone: scanData.client.phoneNumber || "",
          email: scanData.client.email || "",
        },
        anonymous: false,
      }));
      
      // Cerrar el scanner primero
      setShowQrScanner(false);
      
      // Reabrir el modal de detalles
      setTimeout(() => {
        setShowOrderDetailsModal(true);
        // Abrir el dashboard de puntos después de un breve delay
        setTimeout(() => {
          setShowPointsDashboard(true);
        }, 500);
      }, 100);
      
      toast.success(`Cliente ${scanData.client.fullName} identificado correctamente`);
    }
  };
  
  const handleRewardRedeemed = (code: string, rewardData: {
    rewardId: string;
    name: string;
    rewardValue: number;
    isPercentage: boolean;
    pointsRequired?: number;
  }) => {
    // Aplicar la recompensa al formulario
    if (rewardData.isPercentage) {
      setFormData(prev => ({
        ...prev,
        discount: rewardData.rewardValue,
        discountType: "porcentaje",
        appliedRewardCode: code,
        appliedReward: {
          code,
          rewardId: rewardData.rewardId,
          name: rewardData.name,
          rewardValue: rewardData.rewardValue,
          isPercentage: true,
        },
        total: prev.subtotal - (prev.subtotal * rewardData.rewardValue / 100),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        discount: rewardData.rewardValue,
        discountType: "cantidad",
        appliedRewardCode: code,
        appliedReward: {
          code,
          rewardId: rewardData.rewardId,
          name: rewardData.name,
          rewardValue: rewardData.rewardValue,
          isPercentage: false,
        },
        total: prev.subtotal - rewardData.rewardValue,
      }));
    }
    
    toast.success(`Recompensa "${rewardData.name}" aplicada con código: ${code}`);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={closeCart}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold">
                Carrito de Compras ({items.length})
              </SheetTitle>
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearCart();
                    toast.info("Carrito vaciado");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Vaciar todo
                </Button>
              )}
            </div>
          </SheetHeader>

          {/* Cart Items */}
          {items.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-4">
                {items.map((item) => {
                  const availableStock = getAvailableStock(item._id);
                  const maxQuantity = availableStock + item.quantity;
                  
                  return (
                    <div key={item._id} className="flex gap-4">
                      {/* Product Image */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingCart className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium line-clamp-2">
                              {item.nombre}
                            </h3>
                            {item.descripcion && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                                {item.descripcion}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mt-1 -mr-2"
                            onClick={() => removeFromCart(item._id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md"
                              onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="w-12 text-center text-sm font-medium">
                              {item.quantity}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md"
                              onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                              disabled={item.quantity >= maxQuantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-sm font-semibold">
                            ${(item.precio * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="px-6 py-4 space-y-2 border-t">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium mb-2">Tu carrito está vacío</p>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Agrega algunos productos para comenzar
              </p>
              <Button onClick={closeCart} className="gap-2">
                Continuar comprando
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Checkout Button */}
          {items.length > 0 && (
            <div className="border-t px-6 py-4 space-y-4">
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={processingOrder}
                style={{ 
                  backgroundColor: colors?.primary || "#6366f1",
                }}
              >
                {processingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Finalizar Compra
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Completa los detalles de tu pedido en el siguiente paso
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Order Details Modal */}
      <OrderDetailsModal
        show={showOrderDetailsModal}
        onHide={() => setShowOrderDetailsModal(false)}
        formData={formData}
        setFormData={setFormData}
        cashRegister={cashRegister}
        loadingCashRegister={loadingCashRegister}
        isSocialMedia={isSocialMedia}
        isCashier={isCashier}
        selectedStorageId={selectedStorageId}
        hasPendingDiscountAuth={hasPendingDiscountAuth}
        loading={loading}
        uploadingFiles={uploadingFiles}
        error={error}
        success={success}
        isEcommerceOrder={true}
        onDiscountChange={handleDiscountChange}
        onSubmit={handleSubmitWithFiles}
        onShowDiscountRequestDialog={() => setShowDiscountRequestDialog(true)}
        onCancelDiscount={handleCancelDiscount}
        onScanQR={() => {
          setShowOrderDetailsModal(false);
          setShowQrScanner(true);
        }}
      />

      {/* Discount Auth Modal */}
      <DiscountAuthModal
        show={showDiscountRequestDialog}
        onHide={() => setShowDiscountRequestDialog(false)}
        onSubmit={(message) => {
          setDiscountRequestMessage(message);
          setHasPendingDiscountAuth(true);
          setShowDiscountRequestDialog(false);
          toast.info("Solicitud de descuento enviada. Procede con la orden.");
        }}
      />

      {/* QR Scanner Modal */}
      <QRScanner
        show={showQrScanner}
        onHide={() => setShowQrScanner(false)}
        onScanSuccess={handleQRScanSuccess}
        branchId={branchId}
        showRewards={false}
      />

      {/* Modal del Dashboard de Puntos */}
      {scannedClientData && (
        <ClientPointsDashboardModal
          show={showPointsDashboard}
          onHide={() => {
            setShowPointsDashboard(false);
            // No limpiar scannedClientData para mantener los datos del cliente en el formulario
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
          onRewardRedeemed={handleRewardRedeemed}
        />
      )}
    </>
  );
};

export default ClientCartModal;