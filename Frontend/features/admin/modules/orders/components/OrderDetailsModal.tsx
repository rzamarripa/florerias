"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Phone,
  Mail,
  Store,
  Upload,
  CreditCard,
  Send,
  Search,
  ExternalLink,
  Eye,
  EyeOff,
  Shield,
  Trash2,
  Gift,
  Check,
  X,
  ScanLine,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateOrderData, ShippingType, AppliedRewardInfo } from "../types";
import { Client, AvailableRewardItem } from "@/features/admin/modules/clients/types";
import { PaymentMethod } from "@/features/admin/modules/payment-methods/types";
import { CashRegister } from "@/features/admin/modules/cash-registers/types";
import { Neighborhood } from "@/features/admin/modules/neighborhoods/types";
import { clientsService } from "@/features/admin/modules/clients/services/clients";
import ClientRewardsModal from "./ClientRewardsModal";
import ClientRedeemedRewardsModal from "@/features/admin/modules/clients/components/ClientRedeemedRewardsModal";
import StripePaymentModal from "./StripePaymentModal";
import { paymentMethodsService } from "@/features/admin/modules/payment-methods/services/paymentMethods";
import { isCardPaymentMethod } from "@/services/stripeService";
import { neighborhoodsService } from "@/features/admin/modules/neighborhoods/services/neighborhoods";
import { toast } from "react-toastify";
import {
  setCustomValidationMessage,
  resetCustomValidationMessage,
} from "@/utils/formValidation";

interface OrderDetailsModalProps {
  show: boolean;
  onHide: () => void;
  formData: CreateOrderData;
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderData>>;
  cashRegister: CashRegister | null;
  loadingCashRegister: boolean;
  isSocialMedia: boolean;
  isCashier: boolean;
  selectedStorageId: string;
  hasPendingDiscountAuth: boolean;
  loading: boolean;
  uploadingFiles: boolean;
  error: string | null;
  success: boolean;
  scannedClientId?: string | null;
  onDiscountChange: (value: number, tipo: "porcentaje" | "cantidad") => void;
  onSubmit: (e: React.FormEvent, files: { comprobante: File | null; arreglo: File | null }) => void;
  onShowDiscountRequestDialog: () => void;
  onCancelDiscount: () => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  onScanQR?: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  show,
  onHide,
  formData,
  setFormData,
  cashRegister,
  loadingCashRegister,
  isSocialMedia,
  isCashier,
  selectedStorageId,
  hasPendingDiscountAuth,
  loading,
  uploadingFiles,
  error,
  success,
  scannedClientId,
  onDiscountChange,
  onSubmit,
  onShowDiscountRequestDialog,
  onCancelDiscount,
  setError,
  setSuccess,
  onScanQR,
}) => {
  const router = useRouter();

  // Estado local del modal
  const [showClientInfo, setShowClientInfo] = useState(true);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [arregloFile, setArregloFile] = useState<File | null>(null);

  // Estado interno para datos que antes venian como props
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  // Estado para recompensas
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showRedeemedRewardsModal, setShowRedeemedRewardsModal] = useState(false);
  const [appliedReward, setAppliedReward] = useState<AppliedRewardInfo | null>(null);
  const [selectedClientForRewards, setSelectedClientForRewards] = useState<Client | null>(null);

  // Estado para pago con Stripe
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripePaymentData, setStripePaymentData] = useState<any>(null);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);
  const [pendingFiles, setPendingFiles] = useState<{ comprobante: File | null; arreglo: File | null } | null>(null);
  const [shouldSubmitOrder, setShouldSubmitOrder] = useState(false);

  // Cargar clientes filtrados por sucursal
  const fetchClients = async (branchId?: string) => {
    setLoadingClients(true);
    try {
      const filters: any = {
        limit: 1000,
        status: true,
      };
      if (branchId) {
        filters.branchId = branchId;
      }
      const response = await clientsService.getAllClients(filters);
      setClients(response.data);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  // Cargar metodos de pago filtrados por sucursal si hay una seleccionada
  const fetchPaymentMethods = async (branchId?: string) => {
    setLoadingPaymentMethods(true);
    try {
      const filters: any = {
        limit: 1000,
        status: true,
      };

      // Si hay un branchId (del formulario o pasado como parametro), usarlo como filtro
      const branchToUse = branchId || formData.branchId;
      if (branchToUse) {
        filters.branchId = branchToUse;
      }

      const response = await paymentMethodsService.getAllPaymentMethods(filters);
      setPaymentMethods(response.data);
      // Establecer el primer metodo de pago si no hay uno seleccionado
      if (response.data.length > 0 && !formData.paymentMethod) {
        setFormData((prev) => ({
          ...prev,
          paymentMethod: response.data[0]._id,
        }));
      }
    } catch (err) {
      console.error("Error al cargar metodos de pago:", err);
      toast.error("Error al cargar los metodos de pago");
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Cargar colonias activas
  const fetchNeighborhoods = async () => {
    setLoadingNeighborhoods(true);
    try {
      const response = await neighborhoodsService.getAllNeighborhoods({
        limit: 1000,
        status: "active",
      });
      setNeighborhoods(response.data);
    } catch (err) {
      console.error("Error al cargar colonias:", err);
      toast.error("Error al cargar las colonias");
    } finally {
      setLoadingNeighborhoods(false);
    }
  };

  // Cargar datos al montar o cuando se abre el modal
  useEffect(() => {
    if (show) {
      // Pasar el branchId del formulario para filtrar metodos de pago
      fetchPaymentMethods(formData.branchId);
      fetchNeighborhoods();
      if (formData.branchId) {
        fetchClients(formData.branchId);
      }
    }
  }, [show]);

  // Efecto para actualizar el cliente seleccionado cuando se escanea un QR
  useEffect(() => {
    if (show && scannedClientId && clients.length > 0) {
      // Buscar si el cliente escaneado esta en la lista de clientes
      const clientExists = clients.find(c => c._id === scannedClientId);
      if (clientExists) {
        // Seleccionar automaticamente el cliente en el select
        setSelectedClientId(scannedClientId);
        handleClientSelect(scannedClientId);
      }
    }
  }, [show, scannedClientId, clients]);

  // Recargar clientes cuando cambia la sucursal
  useEffect(() => {
    if (show && formData.branchId) {
      fetchClients(formData.branchId);
    }
  }, [formData.branchId, show]);

  // Reset files cuando se cierra el modal
  useEffect(() => {
    if (!show) {
      setComprobanteFile(null);
      setArregloFile(null);
      // Solo limpiar el cliente si no hay uno escaneado
      if (!scannedClientId) {
        setSelectedClientId("");
      }
      setAppliedReward(null);
      setShowRewardsModal(false);
      setStripePaymentData(null);
      setPendingOrderData(null);
      setPendingFiles(null);
      setShouldSubmitOrder(false);
    }
  }, [show, scannedClientId]);

  // Efecto para manejar el envio de la orden despues del pago con Stripe
  useEffect(() => {
    if (shouldSubmitOrder && pendingFiles && stripePaymentData) {
      // Asegurar que el formData tenga los datos de Stripe antes de enviar
      console.log("Enviando orden con datos de Stripe:", {
        stripePaymentIntentId: formData.stripePaymentIntentId,
        stripePaymentMethodId: formData.stripePaymentMethodId,
        stripePaymentStatus: formData.stripePaymentStatus,
      });

      const fakeEvent = new Event('submit') as any;
      onSubmit(fakeEvent, pendingFiles);
      setShouldSubmitOrder(false);
    }
  }, [shouldSubmitOrder, formData.stripePaymentIntentId]);

  // Manejar seleccion de cliente
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);

    // Limpiar recompensa al cambiar de cliente
    setAppliedReward(null);
    setSelectedClientForRewards(null);

    if (!clientId) {
      // Recalcular total sin recompensa si habia una aplicada
      const manualDiscountAmount =
        formData.discountType === "porcentaje"
          ? (formData.subtotal * (formData.discount || 0)) / 100
          : formData.discount || 0;
      const deliveryPrice = formData.deliveryData.deliveryPrice || 0;
      const newTotal = Math.max(0, formData.subtotal - manualDiscountAmount + deliveryPrice);
      const remainingBalance = newTotal - (formData.advance || 0);

      setFormData((prev) => ({
        ...prev,
        clientInfo: {
          name: "",
          phone: "",
          email: "",
        },
        total: newTotal,
        remainingBalance,
        appliedRewardCode: null,
        appliedReward: null,
      }));
      return;
    }

    const selectedClient = clients.find((c) => c._id === clientId);
    if (selectedClient) {
      setSelectedClientForRewards(selectedClient);
      // Recalcular total sin recompensa si habia una aplicada
      const manualDiscountAmount =
        formData.discountType === "porcentaje"
          ? (formData.subtotal * (formData.discount || 0)) / 100
          : formData.discount || 0;
      const deliveryPrice = formData.deliveryData.deliveryPrice || 0;
      const newTotal = Math.max(0, formData.subtotal - manualDiscountAmount + deliveryPrice);
      const remainingBalance = newTotal - (formData.advance || 0);

      setFormData((prev) => ({
        ...prev,
        clientInfo: {
          clientId: selectedClient._id,
          name: `${selectedClient.name} ${selectedClient.lastName}`,
          phone: selectedClient.phoneNumber,
          email: selectedClient.email || "",
        },
        total: newTotal,
        remainingBalance,
        appliedRewardCode: null,
        appliedReward: null,
      }));
    }
  };

  // Manejar cambio de colonia
  const handleNeighborhoodChange = (neighborhoodId: string) => {
    const selectedNeighborhood = neighborhoods.find(
      (n) => n._id === neighborhoodId
    );
    const deliveryPrice = selectedNeighborhood
      ? selectedNeighborhood.priceDelivery
      : 0;

    // Recalcular totales
    const discountAmount =
      formData.discountType === "porcentaje"
        ? (formData.subtotal * (formData.discount || 0)) / 100
        : formData.discount || 0;
    const total = formData.subtotal - discountAmount + deliveryPrice;
    const remainingBalance = total - (formData.advance || 0);

    setFormData((prev) => ({
      ...prev,
      deliveryData: {
        ...prev.deliveryData,
        neighborhoodId,
        deliveryPrice,
      },
      total,
      remainingBalance,
    }));
  };

  // Manejar cambio de tipo de envio
  const handleShippingTypeChange = (shippingType: ShippingType) => {
    const deliveryPrice = shippingType === "tienda" ? 0 : formData.deliveryData.deliveryPrice || 0;
    const discountAmount =
      formData.discountType === "porcentaje"
        ? (formData.subtotal * (formData.discount || 0)) / 100
        : formData.discount || 0;
    const total = formData.subtotal - discountAmount + deliveryPrice;
    const remainingBalance = total - (formData.advance || 0);

    setFormData((prev) => ({
      ...prev,
      shippingType,
      deliveryData: {
        ...prev.deliveryData,
        deliveryPrice: shippingType === "tienda" ? 0 : prev.deliveryData.deliveryPrice || 0,
        neighborhoodId: shippingType === "tienda" ? "" : prev.deliveryData.neighborhoodId,
      },
      total,
      remainingBalance,
    }));
  };

  // Manejar cambio de anticipo
  const handleAdvanceChange = (value: number) => {
    const advance = isNaN(value) ? 0 : value;
    const remainingBalance = formData.total - advance;
    const changeAmount = (formData.paidWith || 0) - advance;

    setFormData((prev) => ({
      ...prev,
      advance,
      remainingBalance,
      change: changeAmount > 0 ? changeAmount : 0,
    }));
  };

  // Manejar cambio de pago con
  const handlePaidWithChange = (value: number) => {
    const paidWith = isNaN(value) ? 0 : value;
    const changeAmount = paidWith - (formData.advance || 0);

    setFormData((prev) => ({
      ...prev,
      paidWith,
      change: changeAmount > 0 ? changeAmount : 0,
    }));
  };

  // Manejar seleccion de recompensa desde el modal
  const handleSelectReward = (rewardItem: AvailableRewardItem) => {
    console.log("Reward seleccionado:", {
      isProducto: rewardItem.reward.isProducto,
      productId: rewardItem.reward.productId,
      rewardType: rewardItem.reward.rewardType,
      rewardValue: rewardItem.reward.rewardValue,
    });

    // Si es una recompensa de producto, agregar como item
    if (rewardItem.reward.isProducto && rewardItem.reward.productId) {
      const productReward = rewardItem.reward.productId;

      // Crear el item de recompensa
      const rewardOrderItem = {
        isProduct: true,
        productId: productReward._id,
        productName: productReward.nombre,
        quantity: rewardItem.reward.productQuantity,
        unitPrice: 0, // Gratis
        amount: 0, // Gratis
        productCategory: productReward.productCategory || null,
        insumos: [],
        isReward: true,
        rewardCode: rewardItem.code,
      };

      // Guardar info de la recompensa aplicada (para UI)
      const newAppliedReward: AppliedRewardInfo = {
        code: rewardItem.code,
        rewardId: rewardItem.reward._id,
        name: rewardItem.reward.name,
        rewardValue: 0,
        isPercentage: false,
      };
      setAppliedReward(newAppliedReward);

      // Agregar el item a la orden
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, rewardOrderItem],
        appliedRewardCode: rewardItem.code,
        appliedReward: newAppliedReward,
      }));

      toast.success(`Producto "${productReward.nombre}" agregado como recompensa`);
    } else {
      // Recompensa de descuento - comportamiento original
      const newAppliedReward: AppliedRewardInfo = {
        code: rewardItem.code,
        rewardId: rewardItem.reward._id,
        name: rewardItem.reward.name,
        rewardValue: rewardItem.reward.rewardValue,
        isPercentage: rewardItem.reward.isPercentage,
      };
      setAppliedReward(newAppliedReward);

      // Calcular el nuevo total con el descuento de la recompensa
      const rewardDiscount = newAppliedReward.isPercentage
        ? (formData.subtotal * newAppliedReward.rewardValue) / 100
        : newAppliedReward.rewardValue;

      // Calcular descuento total (descuento manual + recompensa)
      const manualDiscountAmount =
        formData.discountType === "porcentaje"
          ? (formData.subtotal * (formData.discount || 0)) / 100
          : formData.discount || 0;

      const totalDiscount = manualDiscountAmount + rewardDiscount;
      const deliveryPrice = formData.deliveryData.deliveryPrice || 0;
      const newTotal = Math.max(0, formData.subtotal - totalDiscount + deliveryPrice);
      // Asegurar que remainingBalance no sea negativo
      const remainingBalance = Math.max(0, newTotal - (formData.advance || 0));

      setFormData((prev) => ({
        ...prev,
        total: newTotal,
        remainingBalance,
        appliedRewardCode: newAppliedReward.code,
        appliedReward: newAppliedReward,
      }));

      toast.success(`Recompensa "${newAppliedReward.name}" aplicada correctamente`);
    }
  };

  // Remover recompensa aplicada
  const handleRemoveReward = () => {
    if (!appliedReward) return;

    // Verificar si hay un item de recompensa de producto para remover
    const hasProductRewardItem = formData.items.some(
      (item) => item.isReward && item.rewardCode === appliedReward.code
    );

    if (hasProductRewardItem) {
      // Remover el item de recompensa de producto
      setAppliedReward(null);
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter(
          (item) => !(item.isReward && item.rewardCode === appliedReward.code)
        ),
        appliedRewardCode: null,
        appliedReward: null,
      }));
      toast.info("Recompensa de producto removida");
    } else {
      // Recalcular el total sin el descuento de la recompensa
      const manualDiscountAmount =
        formData.discountType === "porcentaje"
          ? (formData.subtotal * (formData.discount || 0)) / 100
          : formData.discount || 0;

      const deliveryPrice = formData.deliveryData.deliveryPrice || 0;
      const newTotal = Math.max(0, formData.subtotal - manualDiscountAmount + deliveryPrice);
      const remainingBalance = newTotal - (formData.advance || 0);

      setAppliedReward(null);
      setFormData((prev) => ({
        ...prev,
        total: newTotal,
        remainingBalance,
        appliedRewardCode: null,
        appliedReward: null,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar si el metodo de pago seleccionado es tarjeta
    const selectedMethod = paymentMethods.find(m => m._id === formData.paymentMethod);
    if (selectedMethod && isCardPaymentMethod(selectedMethod.name)) {
      // Si es pago con tarjeta, guardar datos y abrir modal de Stripe
      setPendingOrderData(formData);
      setPendingFiles({ comprobante: comprobanteFile, arreglo: arregloFile });
      setShowStripeModal(true);
    } else {
      // Si no es tarjeta, proceder con el flujo normal
      onSubmit(e, { comprobante: comprobanteFile, arreglo: arregloFile });
    }
  };

  // Manejar exito del pago con Stripe
  const handleStripePaymentSuccess = (paymentData: any) => {
    console.log("Pago exitoso con Stripe, datos recibidos:", paymentData);

    setStripePaymentData(paymentData);
    setShowStripeModal(false);

    // Actualizar el formData con la informacion del pago
    const updatedFormData = {
      ...pendingOrderData,
      stripePaymentIntentId: paymentData.paymentIntentId,
      stripePaymentMethodId: paymentData.paymentMethodId,
      stripePaymentStatus: paymentData.status,
      stripeCustomerId: paymentData.stripeCustomerId,
    };

    console.log("Actualizando formData con datos de Stripe:", updatedFormData);

    // IMPORTANTE: Actualizar el estado formData del componente padre con los datos de Stripe
    setFormData(updatedFormData);

    // Activar el flag para que el useEffect envie la orden
    setShouldSubmitOrder(true);

    toast.success("Pago procesado exitosamente. Creando orden...");
  };

  // Manejar error del pago con Stripe
  const handleStripePaymentError = (error: string) => {
    toast.error(`Error en el pago: ${error}`);
    setShowStripeModal(false);
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="!w-[80vw] !max-w-none max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Datos del pedido
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="flex justify-between items-center">
                  {error}
                  <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                    <X size={14} />
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <AlertDescription className="flex justify-between items-center">
                  Pedido creado exitosamente!
                  <Button variant="ghost" size="sm" onClick={() => setSuccess(false)}>
                    <X size={14} />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Main 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Cliente + Tipo de Envio */}
              <div className="space-y-6">
                {/* Cliente Card */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User size={18} className="text-primary" />
                        <h6 className="font-bold text-base">Cliente</h6>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => setShowClientInfo(!showClientInfo)}
                        className="flex items-center gap-2"
                      >
                        {showClientInfo ? (
                          <>
                            <EyeOff size={16} />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye size={16} />
                            Ver
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Buscar cliente */}
                    <div>
                      <Label className="font-semibold flex items-center gap-1 mb-2">
                        <Search size={16} />
                        Buscar cliente existente
                      </Label>
                      <Select
                        value={selectedClientId}
                        onValueChange={(value) => handleClientSelect(value)}
                        disabled={loadingClients}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente o ingresar nuevo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client._id} value={client._id}>
                              {client.name} {client.lastName} - {client.phoneNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Recompensa - Solo mostrar si hay cliente seleccionado */}
                    {selectedClientId && (
                      <div>
                        <Label className="font-semibold flex items-center gap-1 mb-2">
                          <Gift size={16} />
                          Recompensa
                        </Label>
                        {appliedReward ? (
                          <Alert className="py-2 px-3 flex items-center justify-between bg-green-50 border-green-200">
                            <div className="flex items-center gap-2">
                              <Check size={16} className="text-green-600" />
                              <span className="text-sm">
                                <strong>{appliedReward.name}</strong>
                                {" - "}
                                {appliedReward.rewardValue === 0
                                  ? "Producto gratis"
                                  : appliedReward.isPercentage
                                  ? `${appliedReward.rewardValue}% descuento`
                                  : `$${appliedReward.rewardValue.toFixed(2)} de valor`}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={handleRemoveReward}
                              className="ml-2 py-0 px-2 text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <X size={14} />
                            </Button>
                          </Alert>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => setShowRewardsModal(true)}
                              className="flex items-center justify-center gap-2"
                            >
                              <Gift size={16} />
                              Usar recompensa
                            </Button>
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => setShowRedeemedRewardsModal(true)}
                              className="flex items-center justify-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
                              title="Ver todas las recompensas reclamadas del cliente"
                            >
                              <Eye size={16} />
                              Ver recompensas
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Caja registradora */}
                    {!isSocialMedia && (
                      <div>
                        <Label className="font-semibold flex items-center gap-1 mb-2">
                          <CreditCard size={16} />
                          Caja registradora
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={
                              loadingCashRegister
                                ? "Cargando..."
                                : cashRegister
                                ? cashRegister.name
                                : "No hay caja asignada"
                            }
                            readOnly
                            disabled
                            className="bg-gray-50 flex-1"
                          />
                          {cashRegister ? (
                            <Badge
                              variant={cashRegister.isOpen ? "default" : "secondary"}
                              className={`flex items-center justify-center px-3 min-w-[100px] ${
                                cashRegister.isOpen ? "bg-green-500" : ""
                              }`}
                            >
                              {cashRegister.isOpen ? "Abierta" : "Cerrada"}
                            </Badge>
                          ) : (
                            !loadingCashRegister && (
                              <Button
                                variant="default"
                                type="button"
                                onClick={() => router.push("/ventas/cajas")}
                                className="flex items-center gap-2"
                              >
                                <ExternalLink size={16} />
                                Ir a Cajas
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {showClientInfo && (
                      <>
                        {/* Nombre y Telefono - paired fields */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-semibold flex justify-between items-center mb-2">
                              <span className="flex items-center gap-1">
                                <User size={16} />
                                Nombre
                              </span>
                              {onScanQR && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  type="button"
                                  onClick={onScanQR}
                                >
                                  <ScanLine size={14} className="mr-1" />
                                  QR
                                </Button>
                              )}
                            </Label>
                            <Input
                              type="text"
                              placeholder="Nombre del cliente"
                              value={formData.clientInfo.name}
                              onChange={(e) => {
                                resetCustomValidationMessage(e as any);
                                setFormData((prev) => ({
                                  ...prev,
                                  clientInfo: { ...prev.clientInfo, name: e.target.value },
                                }));
                              }}
                              onInvalid={(e) => setCustomValidationMessage(e as any)}
                              required
                            />
                          </div>
                          <div>
                            <Label className="font-semibold flex items-center gap-1 mb-2">
                              <Phone size={16} />
                              Telefono
                            </Label>
                            <Input
                              type="tel"
                              placeholder="Telefono"
                              value={formData.clientInfo.phone}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  clientInfo: { ...prev.clientInfo, phone: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>

                        {/* Correo - full width */}
                        <div>
                          <Label className="font-semibold flex items-center gap-1 mb-2">
                            <Mail size={16} />
                            Correo
                          </Label>
                          <Input
                            type="email"
                            placeholder="Correo electronico"
                            value={formData.clientInfo.email}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                clientInfo: { ...prev.clientInfo, email: e.target.value },
                              }))
                            }
                          />
                        </div>

                        {/* Canal de venta */}
                        {!isSocialMedia && !isCashier && (
                          <div>
                            <Label className="font-semibold flex items-center gap-1 mb-2">
                              <Store size={16} />
                              Canal de venta
                            </Label>
                            <Select
                              value={formData.salesChannel}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  salesChannel: value as "tienda" | "whatsapp" | "facebook" | "instagram",
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tienda">Tienda</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="facebook">Facebook</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Tipo de Envio Card */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Send size={18} className="text-primary" />
                      <h6 className="font-bold text-base">Tipo de Envio</h6>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isSocialMedia ? (
                      <>
                        <Alert className="bg-blue-50 border-blue-200">
                          <AlertDescription>
                            Como usuario de Redes Sociales, solo puedes crear ordenes de tipo "Redes Sociales"
                          </AlertDescription>
                        </Alert>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-semibold flex items-center gap-1 mb-2">
                              <Store size={16} />
                              Tipo de Envio
                            </Label>
                            <Input type="text" value="Redes Sociales" disabled className="bg-gray-50" />
                          </div>
                          <div>
                            <Label className="font-semibold flex items-center gap-1 mb-2">
                              <Store size={16} />
                              Plataforma
                            </Label>
                            <Select
                              value={formData.socialMedia || "whatsapp"}
                              onValueChange={(value) => {
                                const platform = value as "whatsapp" | "facebook" | "instagram";
                                setFormData((prev) => ({
                                  ...prev,
                                  socialMedia: platform,
                                  salesChannel: platform,
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="facebook">Facebook</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-4 items-center">
                        {["envio", "tienda"].map((tipo) => (
                          <div key={tipo} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`envio-${tipo}`}
                              name="envio"
                              value={tipo}
                              checked={formData.shippingType === tipo}
                              onChange={(e) => handleShippingTypeChange(e.target.value as ShippingType)}
                              className="h-4 w-4"
                            />
                            <label htmlFor={`envio-${tipo}`} className="text-sm font-medium">
                              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                            </label>
                          </div>
                        ))}
                        <div className="border-l pl-4 flex gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="anonimo-check"
                              checked={formData.anonymous}
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, anonymous: checked as boolean }))
                              }
                            />
                            <label htmlFor="anonimo-check" className="text-sm font-medium">
                              Anonimo
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="venta-rapida-check"
                              checked={formData.quickSale}
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, quickSale: checked as boolean }))
                              }
                            />
                            <label htmlFor="venta-rapida-check" className="text-sm font-medium">
                              Venta Rapida
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Nombre receptor y Fecha - paired */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold mb-2 block">Nombre de quien recibe</Label>
                        <Input
                          type="text"
                          placeholder="Nombre del receptor"
                          value={formData.deliveryData.recipientName}
                          onChange={(e) => {
                            resetCustomValidationMessage(e as any);
                            setFormData((prev) => ({
                              ...prev,
                              deliveryData: { ...prev.deliveryData, recipientName: e.target.value },
                            }));
                          }}
                          onInvalid={(e) => setCustomValidationMessage(e as any)}
                          required
                        />
                      </div>
                      <div>
                        <Label className="font-semibold mb-2 block">Fecha y hora de entrega</Label>
                        <Input
                          type="datetime-local"
                          value={formData.deliveryData.deliveryDateTime}
                          onChange={(e) => {
                            resetCustomValidationMessage(e as any);
                            setFormData((prev) => ({
                              ...prev,
                              deliveryData: { ...prev.deliveryData, deliveryDateTime: e.target.value },
                            }));
                          }}
                          onInvalid={(e) => setCustomValidationMessage(e as any)}
                          min={new Date().toISOString().slice(0, 16)}
                          required
                        />
                      </div>
                    </div>

                    {/* Mensaje - full width */}
                    <div>
                      <Label className="font-semibold mb-2 block">Mensaje / Comentario</Label>
                      <Textarea
                        rows={2}
                        placeholder="Mensaje para la tarjeta o comentario"
                        value={formData.deliveryData.message}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            deliveryData: { ...prev.deliveryData, message: e.target.value },
                          }))
                        }
                      />
                    </div>

                    {formData.shippingType === "envio" && (
                      <>
                        {/* Calle y Colonia - paired */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-semibold mb-2 block">Calle y numero</Label>
                            <Input
                              type="text"
                              placeholder="Ej: Av. Principal #123"
                              value={formData.deliveryData.street}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  deliveryData: { ...prev.deliveryData, street: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label className="font-semibold mb-2 block">Colonia</Label>
                            <Select
                              value={formData.deliveryData.neighborhoodId}
                              onValueChange={(value) => handleNeighborhoodChange(value)}
                              disabled={loadingNeighborhoods}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar colonia..." />
                              </SelectTrigger>
                              <SelectContent>
                                {neighborhoods.map((neighborhood) => (
                                  <SelectItem key={neighborhood._id} value={neighborhood._id}>
                                    {neighborhood.name} - ${neighborhood.priceDelivery.toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Referencias - full width */}
                        <div>
                          <Label className="font-semibold mb-2 block">Senas o referencias</Label>
                          <Textarea
                            rows={2}
                            placeholder="Ej: Casa blanca con porton negro..."
                            value={formData.deliveryData.reference}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                deliveryData: { ...prev.deliveryData, reference: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </>
                    )}

                    {/* Archivos - paired */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold flex items-center gap-1 mb-2">
                          <Upload size={16} />
                          Comprobante
                        </Label>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            if (file) setComprobanteFile(file);
                          }}
                        />
                        {comprobanteFile && (
                          <p className="text-sm text-green-600 mt-1 truncate">
                            Archivo: {comprobanteFile.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="font-semibold flex items-center gap-1 mb-2">
                          <Upload size={16} />
                          Arreglo
                        </Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            if (file) setArregloFile(file);
                          }}
                        />
                        {arregloFile && (
                          <p className="text-sm text-green-600 mt-1 truncate">
                            Archivo: {arregloFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Forma de Pago */}
              <div>
                <Card className="border shadow-sm h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className="text-primary" />
                      <h6 className="font-bold text-base">Forma de Pago</h6>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Metodo de Pago */}
                    <div>
                      <Label className="font-semibold mb-2 block">Metodo de Pago</Label>
                      <div className="flex gap-2 flex-wrap">
                        {loadingPaymentMethods ? (
                          <div className="text-muted-foreground">Cargando metodos de pago...</div>
                        ) : paymentMethods.length === 0 ? (
                          <Alert variant="destructive" className="w-full">
                            <AlertDescription>No hay metodos de pago disponibles.</AlertDescription>
                          </Alert>
                        ) : (
                          paymentMethods.map((method) => {
                            const isDisabled =
                              isSocialMedia && method.name.toLowerCase() === "efectivo";
                            return (
                              <Button
                                key={method._id}
                                type="button"
                                variant={
                                  formData.paymentMethod === method._id
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setFormData((prev) => ({ ...prev, paymentMethod: method._id }))
                                }
                                disabled={isDisabled}
                                className="px-4"
                                title={
                                  isDisabled
                                    ? "Los usuarios de Redes Sociales no pueden usar efectivo"
                                    : ""
                                }
                              >
                                {method.name}
                              </Button>
                            );
                          })
                        )}
                      </div>
                      {isSocialMedia && (
                        <Alert className="mt-2 py-2 bg-yellow-50 border-yellow-200">
                          <AlertDescription>
                            <small>
                              Los usuarios de Redes Sociales no pueden usar el metodo de pago "Efectivo"
                            </small>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <hr className="my-4" />

                    {/* Descuento - full width */}
                    <div>
                      <Label className="font-semibold mb-2 block">Descuento</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.discount}
                          onChange={(e) =>
                            onDiscountChange(
                              parseFloat(e.target.value) || 0,
                              formData.discountType || "porcentaje"
                            )
                          }
                          placeholder="Ingresa el descuento"
                          className="flex-1"
                        />
                        <Select
                          value={formData.discountType}
                          onValueChange={(value) =>
                            onDiscountChange(
                              formData.discount || 0,
                              value as "porcentaje" | "cantidad"
                            )
                          }
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="porcentaje">%</SelectItem>
                            <SelectItem value="cantidad">$</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(formData.discount || 0) > 0 && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            type="button"
                            size="sm"
                            onClick={onShowDiscountRequestDialog}
                            className="flex items-center gap-2 text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                          >
                            <Shield size={16} />
                            {hasPendingDiscountAuth ? "Modificar" : "Solicitar Auth"}
                          </Button>
                          <Button
                            variant="outline"
                            type="button"
                            size="sm"
                            onClick={onCancelDiscount}
                            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                            title="Cancelar descuento"
                          >
                            <Trash2 size={16} />
                            Cancelar
                          </Button>
                        </div>
                      )}
                      <Alert
                        className={`mt-3 py-2 ${
                          hasPendingDiscountAuth
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <AlertDescription>
                          <small>
                            {hasPendingDiscountAuth
                              ? "Descuento pendiente de autorizacion."
                              : "Ingresa el descuento y solicita autorizacion antes de crear la orden."}
                          </small>
                        </AlertDescription>
                      </Alert>
                    </div>

                    {/* Price Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold">${formData.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Descuento</span>
                        <span className="text-red-500 font-semibold">
                          -$
                          {(formData.discountType === "porcentaje"
                            ? (formData.subtotal * (formData.discount || 0)) / 100
                            : formData.discount || 0
                          ).toFixed(2)}
                        </span>
                      </div>
                      {appliedReward && appliedReward.rewardValue > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Gift size={12} />
                            Recompensa
                          </span>
                          <span className="text-green-500 font-semibold">
                            -$
                            {(appliedReward.isPercentage
                              ? (formData.subtotal * appliedReward.rewardValue) / 100
                              : appliedReward.rewardValue
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Envio</span>
                        <span className="text-green-500 font-semibold">
                          +${(formData.deliveryData.deliveryPrice || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-3 mt-2">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-2xl font-bold text-primary">${formData.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Anticipo y Pago - paired */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold mb-2 block">Anticipo</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.advance}
                          onChange={(e) => handleAdvanceChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="font-semibold mb-2 block">Pago con</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.paidWith}
                          onChange={(e) => handlePaidWithChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Cambio y Saldo - paired */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold mb-2 block">Cambio</Label>
                        <Input
                          type="text"
                          value={`$${(formData.change || 0).toFixed(2)}`}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold mb-2 block">Saldo</Label>
                        <Input
                          type="text"
                          value={`$${(formData.remainingBalance || 0).toFixed(2)}`}
                          disabled
                          className="bg-gray-50 font-bold"
                        />
                      </div>
                    </div>

                    {/* Enviar a produccion */}
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="enviar-produccion"
                        checked={formData.sendToProduction}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, sendToProduction: checked as boolean }))
                        }
                      />
                      <label htmlFor="enviar-produccion" className="text-sm font-medium">
                        Enviar a produccion
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={onHide}
              disabled={loading || uploadingFiles}
            >
              Seguir agregando
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={
                loading ||
                uploadingFiles ||
                formData.items.length === 0 ||
                !formData.paymentMethod ||
                !cashRegister ||
                (formData.items.some((item) => item.isProduct === true) && !selectedStorageId) ||
                (isSocialMedia && !formData.branchId)
              }
            >
              {uploadingFiles
                ? "Subiendo archivos..."
                : loading
                ? "Procesando..."
                : "Confirmar venta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Modal de pago con Stripe */}
      {showStripeModal && (
        <StripePaymentModal
          show={showStripeModal}
          onHide={() => {
            setShowStripeModal(false);
            setPendingOrderData(null);
            setPendingFiles(null);
            setStripePaymentData(null);
          }}
          amount={pendingOrderData?.advance > 0 ? pendingOrderData.advance : pendingOrderData?.total || formData.total}
          orderId={undefined} // Se asignara despues de crear la orden
          customerInfo={{
            clientId: pendingOrderData?.clientInfo.clientId || formData.clientInfo.clientId,
            name: pendingOrderData?.clientInfo.name || formData.clientInfo.name,
            email: pendingOrderData?.clientInfo.email || formData.clientInfo.email,
            phone: pendingOrderData?.clientInfo.phone || formData.clientInfo.phone,
          }}
          branchId={pendingOrderData?.branchId || formData.branchId}
          onPaymentSuccess={handleStripePaymentSuccess}
          onPaymentError={handleStripePaymentError}
        />
      )}

      {/* Modal de seleccion de recompensas */}
      {formData.clientInfo.clientId && (
        <ClientRewardsModal
          show={showRewardsModal}
          onHide={() => setShowRewardsModal(false)}
          clientId={formData.clientInfo.clientId}
          onSelectReward={handleSelectReward}
        />
      )}

      {/* Modal de recompensas reclamadas */}
      {selectedClientForRewards && (
        <ClientRedeemedRewardsModal
          show={showRedeemedRewardsModal}
          onHide={() => setShowRedeemedRewardsModal(false)}
          client={selectedClientForRewards}
        />
      )}
    </Dialog>
  );
};

export default OrderDetailsModal;
