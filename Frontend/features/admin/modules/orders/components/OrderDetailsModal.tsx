"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Badge,
  Alert,
  Modal,
} from "react-bootstrap";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateOrderData, ShippingType, AppliedRewardInfo } from "../types";
import { Client, AvailableRewardItem } from "@/features/admin/modules/clients/types";
import { PaymentMethod } from "@/features/admin/modules/payment-methods/types";
import { CashRegister } from "@/features/admin/modules/cash-registers/types";
import { Neighborhood } from "@/features/admin/modules/neighborhoods/types";
import { clientsService } from "@/features/admin/modules/clients/services/clients";
import ClientRewardsModal from "./ClientRewardsModal";
import { paymentMethodsService } from "@/features/admin/modules/payment-methods/services/paymentMethods";
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
  onDiscountChange: (value: number, tipo: "porcentaje" | "cantidad") => void;
  onSubmit: (e: React.FormEvent, files: { comprobante: File | null; arreglo: File | null }) => void;
  onShowDiscountRequestDialog: () => void;
  onCancelDiscount: () => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
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
  onDiscountChange,
  onSubmit,
  onShowDiscountRequestDialog,
  onCancelDiscount,
  setError,
  setSuccess,
}) => {
  const router = useRouter();

  // Estado local del modal
  const [showClientInfo, setShowClientInfo] = useState(true);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [arregloFile, setArregloFile] = useState<File | null>(null);

  // Estado interno para datos que antes venían como props
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  // Estado para recompensas
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [appliedReward, setAppliedReward] = useState<AppliedRewardInfo | null>(null);

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

  // Cargar métodos de pago filtrados por sucursal si hay una seleccionada
  const fetchPaymentMethods = async (branchId?: string) => {
    setLoadingPaymentMethods(true);
    try {
      const filters: any = {
        limit: 1000,
        status: true,
      };
      
      // Si hay un branchId (del formulario o pasado como parámetro), usarlo como filtro
      const branchToUse = branchId || formData.branchId;
      if (branchToUse) {
        filters.branchId = branchToUse;
      }
      
      const response = await paymentMethodsService.getAllPaymentMethods(filters);
      setPaymentMethods(response.data);
      // Establecer el primer método de pago si no hay uno seleccionado
      if (response.data.length > 0 && !formData.paymentMethod) {
        setFormData((prev) => ({
          ...prev,
          paymentMethod: response.data[0]._id,
        }));
      }
    } catch (err) {
      console.error("Error al cargar métodos de pago:", err);
      toast.error("Error al cargar los métodos de pago");
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
      // Pasar el branchId del formulario para filtrar métodos de pago
      fetchPaymentMethods(formData.branchId);
      fetchNeighborhoods();
      if (formData.branchId) {
        fetchClients(formData.branchId);
      }
    }
  }, [show]);

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
      setSelectedClientId("");
      setAppliedReward(null);
      setShowRewardsModal(false);
    }
  }, [show]);

  // Manejar selección de cliente
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);

    // Limpiar recompensa al cambiar de cliente
    setAppliedReward(null);

    if (!clientId) {
      // Recalcular total sin recompensa si había una aplicada
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
      // Recalcular total sin recompensa si había una aplicada
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

  // Manejar cambio de tipo de envío
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

  // Manejar selección de recompensa desde el modal
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, { comprobante: comprobanteFile, arreglo: arregloFile });
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <CreditCard size={20} />
            Datos del pedido
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert
              variant="danger"
              onClose={() => setError(null)}
              dismissible
              className="mb-3"
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              variant="success"
              onClose={() => setSuccess(false)}
              dismissible
              className="mb-3"
            >
              ¡Pedido creado exitosamente!
            </Alert>
          )}

          <Row className="g-3">
            {/* Cliente */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white border-0 py-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <User size={18} className="text-primary" />
                      <h6 className="mb-0 fw-bold">Cliente</h6>
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowClientInfo(!showClientInfo)}
                      className="d-flex align-items-center gap-2"
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
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          <Search size={16} className="me-2" />
                          Buscar cliente existente
                        </Form.Label>
                        <Form.Select
                          value={selectedClientId}
                          onChange={(e) => handleClientSelect(e.target.value)}
                          className="py-2"
                          disabled={loadingClients}
                        >
                          <option value="">
                            Seleccionar cliente o ingresar nuevo...
                          </option>
                          {clients.map((client) => (
                            <option key={client._id} value={client._id}>
                              {client.name} {client.lastName} - {client.phoneNumber}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {/* Recompensa - Solo mostrar si hay cliente seleccionado */}
                    {selectedClientId && (
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            <Gift size={16} className="me-2" />
                            Recompensa
                          </Form.Label>
                          {appliedReward ? (
                            <Alert variant="success" className="mb-0 py-2 px-3 d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center gap-2">
                                <Check size={16} />
                                <span>
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
                                variant="outline-danger"
                                size="sm"
                                onClick={handleRemoveReward}
                                className="ms-2 py-0 px-2"
                              >
                                <X size={14} />
                              </Button>
                            </Alert>
                          ) : (
                            <Button
                              variant="outline-primary"
                              onClick={() => setShowRewardsModal(true)}
                              className="w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                            >
                              <Gift size={16} />
                              Usar recompensa
                            </Button>
                          )}
                        </Form.Group>
                      </Col>
                    )}

                    {!isSocialMedia && (
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            <CreditCard size={16} className="me-2" />
                            Caja registradora
                          </Form.Label>
                          <div className="d-flex gap-2">
                            <Form.Control
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
                              className="py-2 bg-light"
                            />
                            {cashRegister ? (
                              <Badge
                                bg={cashRegister.isOpen ? "success" : "secondary"}
                                className="d-flex align-items-center justify-content-center py-2 px-3"
                                style={{ minWidth: "120px", fontSize: "0.9rem" }}
                              >
                                {cashRegister.isOpen ? "🟢 Abierta" : "🔴 Cerrada"}
                              </Badge>
                            ) : (
                              !loadingCashRegister && (
                                <Button
                                  variant="primary"
                                  onClick={() => router.push("/ventas/cajas")}
                                  className="d-flex align-items-center gap-2"
                                  style={{ minWidth: "160px" }}
                                >
                                  <ExternalLink size={16} />
                                  Ir a Cajas
                                </Button>
                              )
                            )}
                          </div>
                        </Form.Group>
                      </Col>
                    )}

                    {showClientInfo && (
                      <>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">
                              <User size={16} className="me-2" />
                              Cliente
                            </Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Nombre del cliente"
                              value={formData.clientInfo.name}
                              onChange={(e) => {
                                resetCustomValidationMessage(e);
                                setFormData((prev) => ({
                                  ...prev,
                                  clientInfo: { ...prev.clientInfo, name: e.target.value },
                                }));
                              }}
                              onInvalid={setCustomValidationMessage}
                              required
                              className="py-2"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">
                              <Phone size={16} className="me-2" />
                              Teléfono
                            </Form.Label>
                            <Form.Control
                              type="tel"
                              placeholder="Teléfono"
                              value={formData.clientInfo.phone}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  clientInfo: { ...prev.clientInfo, phone: e.target.value },
                                }))
                              }
                              className="py-2"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">
                              <Mail size={16} className="me-2" />
                              Correo
                            </Form.Label>
                            <Form.Control
                              type="email"
                              placeholder="Correo electrónico"
                              value={formData.clientInfo.email}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  clientInfo: { ...prev.clientInfo, email: e.target.value },
                                }))
                              }
                              className="py-2"
                            />
                          </Form.Group>
                        </Col>

                        {!isSocialMedia && !isCashier && (
                          <Col md={12}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">
                                <Store size={16} className="me-2" />
                                Canal de venta
                              </Form.Label>
                              <Form.Select
                                value={formData.salesChannel}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    salesChannel: e.target.value as "tienda" | "whatsapp" | "facebook" | "instagram",
                                  }))
                                }
                                required
                                className="py-2"
                              >
                                <option value="tienda">Tienda</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        )}
                      </>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tipo de Envío */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex align-items-center gap-2">
                <Send size={20} className="text-primary" />
                <h5 className="mb-0 fw-bold">Tipo de Envío</h5>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {isSocialMedia ? (
                  <>
                    <Col md={12}>
                      <Alert variant="info" className="mb-3">
                        Como usuario de Redes Sociales, solo puedes crear órdenes de tipo "Redes Sociales"
                      </Alert>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          <Store size={16} className="me-2" />
                          Tipo de Envío
                        </Form.Label>
                        <Form.Control type="text" value="Redes Sociales" disabled className="py-2 bg-light" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          <Store size={16} className="me-2" />
                          Plataforma de Redes Sociales
                        </Form.Label>
                        <Form.Select
                          value={formData.socialMedia || "whatsapp"}
                          onChange={(e) => {
                            const platform = e.target.value as "whatsapp" | "facebook" | "instagram";
                            setFormData((prev) => ({
                              ...prev,
                              socialMedia: platform,
                              salesChannel: platform,
                            }));
                          }}
                          required
                          className="py-2"
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="facebook">Facebook</option>
                          <option value="instagram">Instagram</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </>
                ) : (
                  <Col md={12}>
                    <div className="d-flex gap-4 flex-wrap align-items-center">
                      {["envio", "tienda"].map((tipo) => (
                        <Form.Check
                          key={tipo}
                          type="radio"
                          id={`envio-${tipo}`}
                          name="envio"
                          label={tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                          value={tipo}
                          checked={formData.shippingType === tipo}
                          onChange={(e) => handleShippingTypeChange(e.target.value as ShippingType)}
                          className="custom-radio"
                        />
                      ))}
                      <div className="border-start ps-3 d-flex gap-3">
                        <Form.Check
                          type="checkbox"
                          id="anonimo-check"
                          label="Anónimo"
                          checked={formData.anonymous}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, anonymous: e.target.checked }))
                          }
                        />
                        <Form.Check
                          type="checkbox"
                          id="venta-rapida-check"
                          label="Venta Rápida"
                          checked={formData.quickSale}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, quickSale: e.target.checked }))
                          }
                        />
                      </div>
                    </div>
                  </Col>
                )}

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Nombre de quien recibe</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre del receptor"
                      value={formData.deliveryData.recipientName}
                      onChange={(e) => {
                        resetCustomValidationMessage(e);
                        setFormData((prev) => ({
                          ...prev,
                          deliveryData: { ...prev.deliveryData, recipientName: e.target.value },
                        }));
                      }}
                      onInvalid={setCustomValidationMessage}
                      required
                      className="py-2"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Fecha y hora de entrega</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={formData.deliveryData.deliveryDateTime}
                      onChange={(e) => {
                        resetCustomValidationMessage(e);
                        setFormData((prev) => ({
                          ...prev,
                          deliveryData: { ...prev.deliveryData, deliveryDateTime: e.target.value },
                        }));
                      }}
                      onInvalid={setCustomValidationMessage}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                      className="py-2"
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Mensaje / Comentario</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Mensaje para la tarjeta o comentario"
                      value={formData.deliveryData.message}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          deliveryData: { ...prev.deliveryData, message: e.target.value },
                        }))
                      }
                    />
                  </Form.Group>
                </Col>

                {formData.shippingType === "envio" && (
                  <>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Calle y número</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Ej: Av. Principal #123"
                          value={formData.deliveryData.street}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              deliveryData: { ...prev.deliveryData, street: e.target.value },
                            }))
                          }
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Colonia</Form.Label>
                        <Form.Select
                          value={formData.deliveryData.neighborhoodId}
                          onChange={(e) => handleNeighborhoodChange(e.target.value)}
                          className="py-2"
                          disabled={loadingNeighborhoods}
                        >
                          <option value="">Seleccionar colonia...</option>
                          {neighborhoods.map((neighborhood) => (
                            <option key={neighborhood._id} value={neighborhood._id}>
                              {neighborhood.name} - ${neighborhood.priceDelivery.toFixed(2)}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Señas o referencias</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Ej: Casa blanca con portón negro..."
                          value={formData.deliveryData.reference}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              deliveryData: { ...prev.deliveryData, reference: e.target.value },
                            }))
                          }
                        />
                      </Form.Group>
                    </Col>
                  </>
                )}

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">
                      <Upload size={16} className="me-2" />
                      Comprobante
                    </Form.Label>
                    <Form.Control
                      type="file"
                      className="py-2"
                      accept="image/*,.pdf"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (file) setComprobanteFile(file);
                      }}
                    />
                    {comprobanteFile && (
                      <Form.Text className="text-success">✓ {comprobanteFile.name}</Form.Text>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">
                      <Upload size={16} className="me-2" />
                      Arreglo
                    </Form.Label>
                    <Form.Control
                      type="file"
                      className="py-2"
                      accept="image/*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (file) setArregloFile(file);
                      }}
                    />
                    {arregloFile && (
                      <Form.Text className="text-success">✓ {arregloFile.name}</Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Forma de Pago y Resumen */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex align-items-center gap-2">
                <CreditCard size={20} className="text-primary" />
                <h5 className="mb-0 fw-bold">Forma de Pago</h5>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Label className="fw-semibold">Método de Pago</Form.Label>
                  <div className="d-flex gap-2 flex-wrap">
                    {loadingPaymentMethods ? (
                      <div className="text-muted">Cargando métodos de pago...</div>
                    ) : paymentMethods.length === 0 ? (
                      <Alert variant="danger" className="mb-0 w-100">
                        No hay métodos de pago disponibles.
                      </Alert>
                    ) : (
                      paymentMethods.map((method) => {
                        const isDisabled =
                          isSocialMedia && method.name.toLowerCase() === "efectivo";
                        return (
                          <Button
                            key={method._id}
                            variant={
                              formData.paymentMethod === method._id
                                ? "primary"
                                : "outline-secondary"
                            }
                            size="sm"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, paymentMethod: method._id }))
                            }
                            disabled={isDisabled}
                            className="px-3"
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
                    <Alert variant="warning" className="mt-2 mb-0 py-2">
                      <small>
                        ℹ️ Los usuarios de Redes Sociales no pueden usar el método de pago "Efectivo"
                      </small>
                    </Alert>
                  )}
                </Col>

                <Col md={12}>
                  <hr />
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Descuento</Form.Label>
                    <div className="input-group">
                      <Form.Control
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
                        className="py-2"
                        placeholder="Ingresa el descuento"
                      />
                      <Form.Select
                        value={formData.discountType}
                        onChange={(e) =>
                          onDiscountChange(
                            formData.discount || 0,
                            e.target.value as "porcentaje" | "cantidad"
                          )
                        }
                        style={{ maxWidth: "100px" }}
                      >
                        <option value="porcentaje">%</option>
                        <option value="cantidad">$</option>
                      </Form.Select>
                      {(formData.discount || 0) > 0 && (
                        <>
                          <Button
                            variant="warning"
                            onClick={onShowDiscountRequestDialog}
                            className="d-flex align-items-center gap-2"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            <Shield size={16} />
                            {hasPendingDiscountAuth ? "Modificar Solicitud" : "Solicitar Autorización"}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={onCancelDiscount}
                            className="d-flex align-items-center gap-2 mt-1"
                            style={{ whiteSpace: "nowrap" }}
                            title="Cancelar descuento"
                          >
                            <Trash2 size={16} />
                            Cancelar Descuento
                          </Button>
                        </>
                      )}
                    </div>
                    <Alert
                      variant={hasPendingDiscountAuth ? "warning" : "info"}
                      className="mt-2 mb-0 py-2"
                    >
                      <small>
                        {hasPendingDiscountAuth
                          ? "⚠️ Descuento pendiente de autorización."
                          : "ℹ️ Ingresa el descuento y solicita autorización antes de crear la orden."}
                      </small>
                    </Alert>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Subtotal</span>
                    <span className="fw-semibold">${formData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Descuento</span>
                    <span className="text-danger fw-semibold">
                      -$
                      {(formData.discountType === "porcentaje"
                        ? (formData.subtotal * (formData.discount || 0)) / 100
                        : formData.discount || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  {appliedReward && appliedReward.rewardValue > 0 && (
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted d-flex align-items-center gap-1">
                        <Gift size={12} />
                        Recompensa
                      </span>
                      <span className="text-success fw-semibold">
                        -$
                        {(appliedReward.isPercentage
                          ? (formData.subtotal * appliedReward.rewardValue) / 100
                          : appliedReward.rewardValue
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Envío</span>
                    <span className="text-success fw-semibold">
                      +${(formData.deliveryData.deliveryPrice || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center border-top pt-2">
                    <span className="fs-5 fw-bold">Total</span>
                    <span className="fs-4 fw-bold text-primary">${formData.total.toFixed(2)}</span>
                  </div>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Anticipo</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.advance}
                      onChange={(e) => handleAdvanceChange(parseFloat(e.target.value) || 0)}
                      className="py-2"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Pagó con</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.paidWith}
                      onChange={(e) => handlePaidWithChange(parseFloat(e.target.value) || 0)}
                      className="py-2"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Cambio</Form.Label>
                    <Form.Control
                      type="text"
                      value={`$${(formData.change || 0).toFixed(2)}`}
                      disabled
                      className="py-2 bg-light"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Saldo</Form.Label>
                    <Form.Control
                      type="text"
                      value={`$${(formData.remainingBalance || 0).toFixed(2)}`}
                      disabled
                      className="py-2 bg-light fw-bold"
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Check
                    type="checkbox"
                    id="enviar-produccion"
                    label="Enviar a producción"
                    checked={formData.sendToProduction}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sendToProduction: e.target.checked }))
                    }
                    className="mt-1"
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={onHide}
            disabled={loading || uploadingFiles}
          >
            Seguir agregando
          </Button>
          <Button
            type="submit"
            variant="primary"
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
        </Modal.Footer>
      </Form>

      {/* Modal de selección de recompensas */}
      {formData.clientInfo.clientId && (
        <ClientRewardsModal
          show={showRewardsModal}
          onHide={() => setShowRewardsModal(false)}
          clientId={formData.clientInfo.clientId}
          onSelectReward={handleSelectReward}
        />
      )}
    </Modal>
  );
};

export default OrderDetailsModal;
