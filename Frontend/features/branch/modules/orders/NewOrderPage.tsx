"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, Badge, Alert, Modal } from "react-bootstrap";
import {
  User,
  Phone,
  Mail,
  Store,
  Package,
  Calendar,
  MessageSquare,
  Upload,
  CreditCard,
  Send,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ordersService } from "./services/orders";
import { CreateOrderData, OrderItem, ShippingType } from "./types";
import ProductCatalog from "./components/ProductCatalog";
import { clientsService } from "@/features/admin/modules/clients/services/clients";
import { Client } from "@/features/admin/modules/clients/types";
import { paymentMethodsService } from "@/features/admin/modules/payment-methods/services/paymentMethods";
import { PaymentMethod } from "@/features/admin/modules/payment-methods/types";
import { branchesService } from "@/features/admin/modules/branches/services/branches";
import { Branch } from "@/features/admin/modules/branches/types";
import { cashRegistersService } from "@/features/admin/modules/cash-registers/services/cashRegisters";
import { CashRegister } from "@/features/admin/modules/cash-registers/types";
import { storageService } from "@/features/admin/modules/storage/services/storage";
import { Storage } from "@/features/admin/modules/storage/types";
import { neighborhoodsService } from "@/features/admin/modules/neighborhoods/services/neighborhoods";
import { Neighborhood } from "@/features/admin/modules/neighborhoods/types";
import { toast } from "react-toastify";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { companiesService } from "@/features/admin/modules/companies/services/companies";
import { generateSaleTicket, SaleTicketData } from "./utils/generateSaleTicket";
import { discountAuthService } from "@/features/admin/modules/discount-auth/services/discountAuth";
import { Shield } from "lucide-react";
import { uploadComprobante, uploadArreglo } from "@/services/firebaseStorage";

const NewOrderPage = () => {
  const router = useRouter();
  const { getIsCashier, getIsSocialMedia } = useUserRoleStore();
  const { user } = useUserSessionStore();
  const isCashier = getIsCashier();
  const isSocialMedia = getIsSocialMedia();

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [companyBranches, setCompanyBranches] = useState<Branch[]>([]); // Para usuarios Redes
  const [loadingCompanyBranches, setLoadingCompanyBranches] = useState(false);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [loadingCashRegister, setLoadingCashRegister] = useState(false);
  const [togglingCashRegister, setTogglingCashRegister] = useState(false);
  const [availableCashRegisters, setAvailableCashRegisters] = useState<CashRegister[]>([]);
  const [loadingAvailableCashRegisters, setLoadingAvailableCashRegisters] = useState(false);
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState<string>("");
  const [storage, setStorage] = useState<Storage | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [selectedStorageId, setSelectedStorageId] = useState<string>("");
  const [hasNoStorage, setHasNoStorage] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [showDiscountRequestDialog, setShowDiscountRequestDialog] = useState(false);
  const [discountRequestMessage, setDiscountRequestMessage] = useState("");
  const [requestingDiscount, setRequestingDiscount] = useState(false);
  const [hasPendingDiscountAuth, setHasPendingDiscountAuth] = useState(false);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [arregloFile, setArregloFile] = useState<File | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

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
    orderDate: new Date().toISOString().slice(0, 16), // Fecha y hora actual por defecto
    isSocialMediaOrder: false,
    socialMedia: null,
  });

  const [currentItem, setCurrentItem] = useState<OrderItem>({
    isProduct: false,
    productName: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
  });

  const [currentProductName, setCurrentProductName] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Obtener todos los clientes
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const response = await clientsService.getAllClients({
        limit: 1000,
        status: true,
      });
      setClients(response.data);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  // Obtener todos los métodos de pago
  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const response = await paymentMethodsService.getAllPaymentMethods({
        limit: 1000,
        status: true,
      });
      setPaymentMethods(response.data);
      // Establecer el primer método de pago como predeterminado
      if (response.data.length > 0) {
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

  // Obtener sucursales del usuario Cajero
  const fetchUserBranches = async () => {
    setLoadingBranches(true);
    try {
      const response = await branchesService.getUserBranches();
      setBranches(response.data);
      // Establecer la primera sucursal como predeterminada
      if (response.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          branchId: response.data[0]._id,
        }));
      }
    } catch (err) {
      console.error("Error al cargar sucursales:", err);
      toast.error("Error al cargar las sucursales del usuario");
    } finally {
      setLoadingBranches(false);
    }
  };

  // Obtener sucursales de la empresa para usuario Redes
  const fetchCompanyBranches = async () => {
    setLoadingCompanyBranches(true);
    try {
      const response = await companiesService.getRedesUserBranches();
      setCompanyBranches(response.data);
      // NO establecer automáticamente una sucursal - el usuario debe seleccionar
    } catch (err) {
      console.error("Error al cargar sucursales de la empresa:", err);
      toast.error("Error al cargar las sucursales de tu empresa");
    } finally {
      setLoadingCompanyBranches(false);
    }
  };

  // Obtener caja registradora del usuario
  const fetchUserCashRegister = async () => {
    setLoadingCashRegister(true);
    try {
      const response = await cashRegistersService.getUserCashRegister();
      if (response.data) {
        setCashRegister(response.data);
        setFormData((prev) => ({
          ...prev,
          cashRegisterId: response.data!._id,
        }));
      } else {
        setCashRegister(null);
        setFormData((prev) => ({
          ...prev,
          cashRegisterId: null,
        }));
      }
    } catch (err) {
      console.error("Error al cargar caja registradora:", err);
      toast.error("Error al cargar la caja registradora del usuario");
    } finally {
      setLoadingCashRegister(false);
    }
  };

  // Obtener almacén por sucursal
  const fetchStorageByBranch = async (branchId: string) => {
    setLoadingStorage(true);
    setHasNoStorage(false);
    try {
      const response = await storageService.getStorageByBranch(branchId);
      if (response.data) {
        setStorage(response.data);
        setSelectedStorageId(response.data._id);
        setHasNoStorage(false);
      } else {
        setStorage(null);
        setSelectedStorageId("");
        setHasNoStorage(true);
      }
    } catch (err: any) {
      console.error("Error al cargar almacén:", err);
      setStorage(null);
      setSelectedStorageId("");
      setHasNoStorage(true);
    } finally {
      setLoadingStorage(false);
    }
  };

  // Obtener colonias activas
  const fetchActiveNeighborhoods = async () => {
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

  // Cargar clientes, métodos de pago, sucursales, caja registradora y colonias al montar el componente
  useEffect(() => {
    fetchClients();
    fetchPaymentMethods();

    // Para usuarios Redes, cargar sucursales de su empresa
    if (isSocialMedia) {
      fetchCompanyBranches();
    } else {
      // Para usuarios Cajero, cargar sus sucursales asignadas
      fetchUserBranches();
    }

    fetchUserCashRegister();
    fetchActiveNeighborhoods();
  }, [isSocialMedia]);

  // Configurar valores iniciales para usuarios de Redes
  useEffect(() => {
    if (isSocialMedia) {
      setFormData((prev) => ({
        ...prev,
        shippingType: "redes_sociales",
        isSocialMediaOrder: true,
        socialMedia: "whatsapp", // Valor por defecto
        salesChannel: "whatsapp", // Sincronizar con socialMedia
      }));
    }
  }, [isSocialMedia]);

  // Cargar storage cuando cambia la sucursal
  useEffect(() => {
    if (formData.branchId) {
      fetchStorageByBranch(formData.branchId);
    } else {
      setStorage(null);
      setSelectedStorageId("");
      setHasNoStorage(false);
    }
  }, [formData.branchId]);

  // Función para manejar cambio de sucursal por usuario Redes
  // Obtener cajas de redes sociales disponibles para una sucursal
  const fetchAvailableCashRegisters = async (branchId: string) => {
    if (!branchId) {
      setAvailableCashRegisters([]);
      return;
    }

    setLoadingAvailableCashRegisters(true);
    try {
      const response = await cashRegistersService.getSocialMediaCashRegistersByBranch(branchId);
      if (response.success) {
        setAvailableCashRegisters(response.data);

        // Si el usuario tiene una caja abierta y esa caja pertenece a esta sucursal, seleccionarla automáticamente
        if (cashRegister && cashRegister.isOpen && cashRegister.branchId?._id === branchId) {
          const userCashInBranch = response.data.find((cr: CashRegister) => cr._id === cashRegister._id);
          if (userCashInBranch) {
            setSelectedCashRegisterId(cashRegister._id);
            setFormData((prev) => ({
              ...prev,
              cashRegisterId: cashRegister._id,
            }));
          }
        }
      }
    } catch (err: any) {
      console.error("Error al obtener cajas de redes sociales:", err);
      toast.error("Error al cargar las cajas disponibles");
      setAvailableCashRegisters([]);
    } finally {
      setLoadingAvailableCashRegisters(false);
    }
  };

  const handleBranchChange = (branchId: string) => {
    setFormData((prev) => ({
      ...prev,
      branchId: branchId,
      cashRegisterId: null, // Limpiar la caja seleccionada al cambiar de sucursal
    }));
    setSelectedCashRegisterId(""); // Limpiar selector de caja

    // Para usuarios Redes, cargar cajas disponibles de la sucursal
    if (isSocialMedia && branchId) {
      fetchAvailableCashRegisters(branchId);
    }
  };

  // Manejar selección de caja registradora
  const handleCashRegisterSelect = (cashRegisterId: string) => {
    setSelectedCashRegisterId(cashRegisterId);
    setFormData((prev) => ({
      ...prev,
      cashRegisterId: cashRegisterId || null,
    }));
  };

  // Abrir caja registradora seleccionada
  const handleOpenCashRegister = async () => {
    if (!selectedCashRegisterId) {
      toast.error("Debes seleccionar una caja primero");
      return;
    }

    setTogglingCashRegister(true);
    try {
      const response = await cashRegistersService.toggleOpen(selectedCashRegisterId, true);

      if (response.success) {
        toast.success("Caja abierta exitosamente");
        // Recargar cajas disponibles para actualizar estados
        if (formData.branchId) {
          await fetchAvailableCashRegisters(formData.branchId);
        }
        // Actualizar la caja del usuario
        await fetchUserCashRegister();
      }
    } catch (err: any) {
      console.error("Error al abrir caja:", err);
      toast.error(err.message || "Error al abrir la caja");
    } finally {
      setTogglingCashRegister(false);
    }
  };

  // Actualizar fecha y hora cuando se activa "Venta Rápida"
  useEffect(() => {
    if (formData.quickSale) {
      // Obtener fecha y hora actual en formato ISO para datetime-local
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      setFormData((prev) => ({
        ...prev,
        deliveryData: {
          ...prev.deliveryData,
          deliveryDateTime: currentDateTime,
        },
      }));
    }
  }, [formData.quickSale]);

  // Abrir/Cerrar caja registradora
  const handleToggleCashRegister = async () => {
    if (!cashRegister) return;

    setTogglingCashRegister(true);
    try {
      const response = await cashRegistersService.toggleOpen(
        cashRegister._id,
        !cashRegister.isOpen
      );

      if (response.success) {
        setCashRegister(response.data);
        toast.success(response.message);
      }
    } catch (err: any) {
      console.error("Error al cambiar estado de caja:", err);
      toast.error(err.message || "Error al cambiar estado de la caja");
    } finally {
      setTogglingCashRegister(false);
    }
  };

  // Manejar selección de cliente
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);

    if (!clientId) {
      // Limpiar campos si se deselecciona
      setFormData({
        ...formData,
        clientInfo: {
          name: "",
          phone: "",
          email: "",
        },
      });
      return;
    }

    const selectedClient = clients.find((c) => c._id === clientId);
    if (selectedClient) {
      setFormData({
        ...formData,
        clientInfo: {
          clientId: selectedClient._id,
          name: `${selectedClient.name} ${selectedClient.lastName}`,
          phone: selectedClient.phoneNumber,
          email: selectedClient.email || "",
        },
      });
    }
  };

  // Calcular importe del item actual
  const calculateItemAmount = () => {
    return currentItem.quantity * currentItem.unitPrice;
  };

  // Función helper para recalcular totales incluyendo precio de envío
  const recalculateTotals = (
    items: OrderItem[],
    discount: number,
    discountType: "porcentaje" | "cantidad",
    deliveryPrice: number,
    advance: number
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount =
      discountType === "porcentaje"
        ? (subtotal * discount) / 100
        : discount;
    const total = subtotal - discountAmount + deliveryPrice;

    return {
      subtotal,
      total,
      remainingBalance: total - advance,
    };
  };

  // Agregar item a la lista
  const handleAddItem = () => {
    if (!currentProductName || currentItem.unitPrice <= 0) {
      setError("Por favor completa el nombre del producto y el precio");
      return;
    }

    const newItem: OrderItem = {
      ...currentItem,
      isProduct: false, // Producto manual
      productName: currentProductName,
      amount: calculateItemAmount(),
    };

    const updatedItems = [...formData.items, newItem];
    const totals = recalculateTotals(
      updatedItems,
      formData.discount || 0,
      formData.discountType || "porcentaje",
      formData.deliveryData.deliveryPrice || 0,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      ...totals,
    });

    // Reset current item
    setCurrentItem({
      isProduct: false,
      productName: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    });
    setCurrentProductName("");
    setError(null);
  };

  // Eliminar item
  const handleRemoveItem = async (index: number) => {
    const itemToRemove = formData.items[index];

    // Solo liberar stock si es un producto del catálogo (isProduct: true)
    if (itemToRemove.isProduct && itemToRemove.productId && storage) {
      try {
        // Liberar el stock en el almacén
        const response = await storageService.releaseStock(storage._id, {
          productId: itemToRemove.productId,
          quantity: itemToRemove.quantity,
        });

        // Actualizar el storage local con los datos actualizados
        setStorage(response.data);
      } catch (err: any) {
        console.error("Error al liberar stock:", err);
        toast.error(err.message || "Error al liberar el stock");
        return; // No continuar con la eliminación si falla la liberación
      }
    }

    const updatedItems = formData.items.filter((_, i) => i !== index);
    const totals = recalculateTotals(
      updatedItems,
      formData.discount || 0,
      formData.discountType || "porcentaje",
      formData.deliveryData.deliveryPrice || 0,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      ...totals,
    });

    if (itemToRemove.isProduct) {
      toast.success("Producto eliminado y stock restaurado");
    }
  };

  // Manejar cambio de descuento
  const handleDiscountChange = (
    value: number,
    tipo: "porcentaje" | "cantidad"
  ) => {
    const totals = recalculateTotals(
      formData.items,
      value,
      tipo,
      formData.deliveryData.deliveryPrice || 0,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      discount: value,
      discountType: tipo,
      ...totals,
    });
  };

  // Manejar cambio de anticipo
  const handleAdvanceChange = (value: number) => {
    const advance = isNaN(value) ? 0 : value;
    const remainingBalance = formData.total - advance;
    // Cambio = Pagó con - Anticipo
    const changeAmount = (formData.paidWith || 0) - advance;

    setFormData({
      ...formData,
      advance: advance,
      remainingBalance: remainingBalance,
      change: changeAmount > 0 ? changeAmount : 0,
    });
  };

  // Manejar cambio de pago con
  const handlePaidWithChange = (value: number) => {
    const paidWith = isNaN(value) ? 0 : value;
    const remainingBalance = formData.total - (formData.advance || 0);
    // Cambio = Pagó con - Anticipo
    const changeAmount = paidWith - (formData.advance || 0);

    setFormData({
      ...formData,
      paidWith: paidWith,
      change: changeAmount > 0 ? changeAmount : 0,
    });
  };

  // Manejar solicitud de permiso de descuento - Nueva lógica: aplicar descuento inmediatamente
  const handleRequestDiscountAuth = async () => {
    if (!discountRequestMessage.trim()) {
      toast.error("Por favor ingresa un mensaje de solicitud");
      return;
    }

    const discountValue = parseFloat(formData.discount?.toString() || "0");
    if (discountValue <= 0) {
      toast.error("El valor del descuento debe ser mayor a 0");
      return;
    }

    // Aplicar el descuento inmediatamente al formulario
    const discountType = formData.discountType || "porcentaje";
    const discountAmount = discountType === "porcentaje"
      ? (formData.subtotal * discountValue) / 100
      : discountValue;

    const totals = recalculateTotals(
      formData.items,
      discountValue,
      discountType,
      formData.deliveryData.deliveryPrice || 0,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      discount: discountValue,
      discountType: discountType,
      ...totals,
    });

    // Marcar que hay un descuento pendiente de autorización
    setHasPendingDiscountAuth(true);
    setShowDiscountRequestDialog(false);

    toast.success("Descuento aplicado. Se creará la solicitud al guardar la orden.");
  };

  // Manejar cambio de tipo de envío
  const handleShippingTypeChange = (shippingType: ShippingType) => {
    const deliveryPrice = shippingType === "tienda" ? 0 : formData.deliveryData.deliveryPrice || 0;
    const totals = recalculateTotals(
      formData.items,
      formData.discount || 0,
      formData.discountType || "porcentaje",
      deliveryPrice,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      shippingType,
      deliveryData: {
        ...formData.deliveryData,
        deliveryPrice: shippingType === "tienda" ? 0 : formData.deliveryData.deliveryPrice || 0,
        neighborhoodId: shippingType === "tienda" ? "" : formData.deliveryData.neighborhoodId,
      },
      ...totals,
    });
  };

  // Manejar cambio de colonia
  const handleNeighborhoodChange = (neighborhoodId: string) => {
    const selectedNeighborhood = neighborhoods.find((n) => n._id === neighborhoodId);
    const deliveryPrice = selectedNeighborhood ? selectedNeighborhood.priceDelivery : 0;

    const totals = recalculateTotals(
      formData.items,
      formData.discount || 0,
      formData.discountType || "porcentaje",
      deliveryPrice,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      deliveryData: {
        ...formData.deliveryData,
        neighborhoodId,
        deliveryPrice,
      },
      ...totals,
    });
  };

  // Agregar producto desde catálogo
  const handleAddProductFromCatalog = async (
    product: any,
    quantity: number
  ) => {
    // Validar que haya un storage seleccionado
    if (!storage) {
      toast.error("No hay almacén asignado a esta sucursal. No puedes agregar productos del catálogo sin stock disponible.");
      return;
    }

    // Buscar el producto en el storage para verificar stock
    const productInStorage = storage.products.find(
      (p: any) => p.productId._id === product._id
    );

    if (!productInStorage) {
      toast.error(
        `El producto "${product.nombre}" no está disponible en este almacén`
      );
      return;
    }

    // Calcular cantidad ya agregada de este producto en la orden
    const quantityInOrder = formData.items
      .filter((item) => item.productId === product._id)
      .reduce((sum, item) => sum + item.quantity, 0);

    const totalRequested = quantityInOrder + quantity;

    if (totalRequested > productInStorage.quantity) {
      toast.error(
        `Stock insuficiente. Disponible: ${productInStorage.quantity}, Ya en orden: ${quantityInOrder}, Solicitado: ${quantity}`
      );
      return;
    }

    try {
      // Reservar el stock en el almacén
      const response = await storageService.reserveStock(storage._id, {
        productId: product._id,
        quantity,
      });

      // Actualizar el storage local con los datos actualizados
      setStorage(response.data);

      const newItem: OrderItem = {
        isProduct: true, // Producto del catálogo
        productId: product._id, // ID del producto
        productName: product.nombre, // Nombre del producto
        quantity,
        unitPrice: product.precio,
        amount: quantity * product.precio,
      };

      const updatedItems = [...formData.items, newItem];
      const totals = recalculateTotals(
        updatedItems,
        formData.discount || 0,
        formData.discountType || "porcentaje",
        formData.deliveryData.deliveryPrice || 0,
        formData.advance || 0
      );

      setFormData({
        ...formData,
        items: updatedItems,
        ...totals,
      });

      toast.success("Producto agregado correctamente");
    } catch (err: any) {
      console.error("Error al reservar stock:", err);
      toast.error(err.message || "Error al agregar el producto");
    }
  };

  // Generar e imprimir ticket de venta
  const generateAndPrintSaleTicket = async (orderData: any) => {
    if (!user) {
      console.error("No hay usuario logueado");
      return;
    }

    try {
      // Obtener datos de la empresa/sucursal
      const companyResponse = await companiesService.getCompanyByBranchId(orderData.branchId._id);

      if (!companyResponse.success || !companyResponse.data) {
        throw new Error("No se pudieron obtener los datos de la empresa");
      }

      // Buscar el método de pago seleccionado para obtener su nombre
      const selectedPaymentMethod = paymentMethods.find(
        (pm) => pm._id === (typeof orderData.paymentMethod === 'string' ? orderData.paymentMethod : orderData.paymentMethod._id)
      );

      // Construir datos para el ticket
      const ticketData: SaleTicketData = {
        order: {
          orderNumber: orderData.orderNumber,
          createdAt: orderData.createdAt,
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
          fullName: user.profile?.fullName || "Cajero",
        },
        payments: orderData.payments || [],
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
      } else {
        toast.error("No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador.");
      }
    } catch (error) {
      console.error("Error generando ticket de venta:", error);
      toast.error("Error al generar el ticket de venta");
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.items.length === 0) {
        throw new Error("Debes agregar al menos un producto");
      }

      // Validar que haya una caja registradora asignada
      if (!cashRegister) {
        throw new Error("Debes tener una caja registradora asignada para crear órdenes");
      }

      // Validar que la caja esté abierta
      if (!cashRegister.isOpen) {
        throw new Error("La caja registradora debe estar abierta para crear órdenes");
      }

      // Validar si hay productos del catálogo que requieren almacén
      const hasProductsFromCatalog = formData.items.some(item => item.isProduct === true);

      if (hasProductsFromCatalog && !selectedStorageId) {
        throw new Error("Hay productos del catálogo en la orden pero no hay almacén asignado a la sucursal");
      }

      if (!formData.paymentMethod) {
        throw new Error("Debes seleccionar un método de pago");
      }

      // Validar que usuarios de Redes hayan seleccionado una sucursal
      if (isSocialMedia && !formData.branchId) {
        throw new Error("Debes seleccionar una sucursal antes de crear la orden");
      }

      // Validar que usuarios de Redes usen cajas de redes sociales
      if (isSocialMedia && cashRegister && !cashRegister.isSocialMediaBox) {
        throw new Error("Los usuarios de Redes Sociales deben usar cajas de redes sociales");
      }

      const orderData = {
        ...formData,
        storageId: selectedStorageId || null, // Puede ser null si solo hay productos manuales
        // Para usuarios Cajero, forzar salesChannel a 'tienda'
        // Para usuarios Redes, mantener el salesChannel del formData (sincronizado con plataforma)
        salesChannel: isCashier ? "tienda" : formData.salesChannel,
        hasPendingDiscountAuth, // Enviar flag al backend
      };

      const response = await ordersService.createOrder(orderData);

      // Validar que la respuesta sea exitosa
      if (!response || !response.success) {
        throw new Error(response?.message || "Error al crear la orden");
      }

      // Validar que la respuesta tenga datos
      if (!response.data) {
        throw new Error("No se recibió respuesta del servidor");
      }

      // Subir archivos a Firebase Storage DESPUÉS de crear la orden
      let comprobanteUrl: string | null = null;
      let comprobantePath: string | null = null;
      let arregloUrl: string | null = null;
      let arregloPath: string | null = null;

      if (comprobanteFile || arregloFile) {
        setUploadingFiles(true);
        toast.info("Subiendo archivos a Firebase Storage...");

        try {
          const orderId = response.data._id;

          // Subir comprobante
          if (comprobanteFile) {
            const comprobanteResult = await uploadComprobante(comprobanteFile, orderId);
            comprobanteUrl = comprobanteResult.url;
            comprobantePath = comprobanteResult.path;
          }

          // Subir arreglo
          if (arregloFile) {
            const arregloResult = await uploadArreglo(arregloFile, orderId);
            arregloUrl = arregloResult.url;
            arregloPath = arregloResult.path;
          }

          // Actualizar la orden con las URLs de los archivos
          await ordersService.updateOrder(orderId, {
            comprobanteUrl,
            comprobantePath,
            arregloUrl,
            arregloPath,
          });

          toast.success("Archivos subidos exitosamente");
        } catch (uploadError: any) {
          console.error("Error al subir archivos:", uploadError);
          toast.warning("Orden creada pero hubo un error al subir los archivos. Puedes intentar subirlos después.");
        } finally {
          setUploadingFiles(false);
        }
      }

      // Si hay descuento pendiente, crear la solicitud de autorización
      if (hasPendingDiscountAuth && discountRequestMessage.trim()) {
        try {
          const discountAmount = formData.discountType === "porcentaje"
            ? (formData.subtotal * (formData.discount || 0)) / 100
            : (formData.discount || 0);

          await discountAuthService.createDiscountAuthForOrder({
            message: discountRequestMessage,
            branchId: formData.branchId,
            orderId: response.data._id,
            orderTotal: response.data.total,
            discountValue: formData.discount || 0,
            discountType: formData.discountType || "porcentaje",
            discountAmount: discountAmount,
          });

          toast.success("Solicitud de descuento creada y enviada al gerente");
        } catch (discountErr: any) {
          console.error("Error al crear solicitud de descuento:", discountErr);
          toast.warning("Orden creada pero hubo un error al crear la solicitud de descuento");
        }
      }

      // Mostrar toast de éxito
      toast.success(
        `¡Orden ${response.data.orderNumber || ""} creada exitosamente!`
      );

      // Generar e imprimir ticket de venta
      generateAndPrintSaleTicket(response.data);

      setSuccess(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          // Para Redes usuarios, resetear branchId a vacío para que seleccionen de nuevo
          // Para Cajeros, mantener la sucursal actual
          branchId: isSocialMedia ? "" : (branches.length > 0 ? branches[0]._id : ""),
          cashRegisterId: cashRegister ? cashRegister._id : null,
          clientInfo: {
            name: "",
            phone: "",
            email: "",
          },
          salesChannel: isSocialMedia ? "whatsapp" : "tienda",
          items: [],
          shippingType: isSocialMedia ? "redes_sociales" : "tienda",
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
          paymentMethod: paymentMethods.length > 0 ? paymentMethods[0]._id : "",
          discount: 0,
          discountType: "porcentaje",
          subtotal: 0,
          total: 0,
          advance: 0,
          paidWith: 0,
          change: 0,
          remainingBalance: 0,
          sendToProduction: false,
          orderDate: new Date().toISOString().slice(0, 16), // Resetear a fecha y hora actual
          isSocialMediaOrder: isSocialMedia,
          socialMedia: isSocialMedia ? "whatsapp" : null,
        });
        setSelectedClientId("");
        setHasPendingDiscountAuth(false);
        setDiscountRequestMessage("");
        setComprobanteFile(null);
        setArregloFile(null);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Error al crear el pedido";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-order-page">
      <Row className="g-3">
        {/* Formulario - 65% izquierda */}
        <Col xs={12} lg={8} className="order-2 order-lg-1">
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

          {hasNoStorage && (
            <Alert
              variant="warning"
              className="mb-3 d-flex align-items-center gap-2"
            >
              <Package size={20} />
              <div>
                <strong>No hay almacén asignado a esta sucursal</strong>
                <p className="mb-0 small">
                  Los productos del catálogo se mostrarán con stock en 0. Para poder crear órdenes con productos del catálogo, necesitas crear un almacén para esta sucursal.
                </p>
              </div>
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* Selector de Sucursal - Solo para usuarios Redes */}
            {isSocialMedia && (
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-primary text-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <Store size={20} />
                    <h5 className="mb-0 fw-bold">Seleccionar Sucursal</h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Alert variant="info" className="mb-3">
                    <strong>⚠️ Importante:</strong> Debes seleccionar una sucursal antes de agregar productos. Los productos y almacenes disponibles dependen de la sucursal seleccionada.
                  </Alert>
                  <Form.Group>
                    <Form.Label className="fw-semibold">
                      <Store size={16} className="me-2" />
                      Sucursal
                    </Form.Label>
                    <Form.Select
                      value={formData.branchId}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      required
                      className="py-2"
                      disabled={loadingCompanyBranches}
                    >
                      <option value="">
                        {loadingCompanyBranches
                          ? "Cargando sucursales..."
                          : "-- Selecciona una sucursal --"}
                      </option>
                      {companyBranches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.branchName} - {branch.branchCode}
                        </option>
                      ))}
                    </Form.Select>
                    {companyBranches.length === 0 && !loadingCompanyBranches && (
                      <Alert variant="warning" className="mt-2 mb-0 py-2">
                        <small>
                          No hay sucursales asignadas a tu empresa. Contacta al administrador.
                        </small>
                      </Alert>
                    )}
                  </Form.Group>
                </Card.Body>
              </Card>
            )}

            {/* Selector de Caja - Solo para usuarios Redes después de seleccionar sucursal */}
            {isSocialMedia && formData.branchId && (
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-success text-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <CreditCard size={20} />
                    <h5 className="mb-0 fw-bold">Seleccionar Caja</h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Alert variant="info" className="mb-3">
                    <strong>💡 Información:</strong> Selecciona una caja de redes sociales de esta sucursal. Si no tienes una caja abierta, puedes abrir una directamente desde aquí.
                  </Alert>

                  <Row className="g-3">
                    <Col md={8}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          <CreditCard size={16} className="me-2" />
                          Caja Registradora
                        </Form.Label>
                        <Form.Select
                          value={selectedCashRegisterId}
                          onChange={(e) => handleCashRegisterSelect(e.target.value)}
                          className="py-2"
                          disabled={loadingAvailableCashRegisters}
                        >
                          <option value="">
                            {loadingAvailableCashRegisters
                              ? "Cargando cajas..."
                              : "-- Selecciona una caja --"}
                          </option>
                          {availableCashRegisters.map((cr) => (
                            <option key={cr._id} value={cr._id}>
                              {cr.name} - {cr.isOpen ? "🟢 Abierta" : "🔴 Cerrada"}
                              {cr.cashierId ? ` (${cr.cashierId.username})` : ""}
                            </option>
                          ))}
                        </Form.Select>
                        {availableCashRegisters.length === 0 && !loadingAvailableCashRegisters && (
                          <Alert variant="warning" className="mt-2 mb-0 py-2">
                            <small>
                              No hay cajas de redes sociales disponibles en esta sucursal. Contacta al administrador.
                            </small>
                          </Alert>
                        )}
                      </Form.Group>
                    </Col>

                    {selectedCashRegisterId && !availableCashRegisters.find(cr => cr._id === selectedCashRegisterId && cr.isOpen) && (
                      <Col md={4} className="d-flex align-items-end">
                        <Button
                          variant="success"
                          onClick={handleOpenCashRegister}
                          disabled={togglingCashRegister}
                          className="w-100 py-2"
                        >
                          {togglingCashRegister ? "Abriendo..." : "Abrir Caja"}
                        </Button>
                      </Col>
                    )}
                  </Row>

                  {cashRegister?.isOpen && cashRegister.branchId?._id === formData.branchId && (
                    <Alert variant="success" className="mt-3 mb-0">
                      <strong>✅ Caja Abierta:</strong> {cashRegister.name} - Esta caja está lista para crear órdenes.
                    </Alert>
                  )}
                  {cashRegister?.isOpen && cashRegister.branchId?._id !== formData.branchId && (
                    <Alert variant="info" className="mt-3 mb-0">
                      <strong>ℹ️ Tienes una caja abierta en otra sucursal:</strong> {cashRegister.name} ({cashRegister.branchId?.branchName || 'Sucursal desconocida'}). Selecciona una caja de esta sucursal para crear órdenes aquí.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Información del Cliente */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <User size={20} className="text-primary" />
                    <h5 className="mb-0 fw-bold">Información del Cliente</h5>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowClientInfo(!showClientInfo)}
                    className="d-flex align-items-center gap-2 mx-2"
                  >
                    {showClientInfo ? (
                      <>
                        <EyeOff size={16} />
                        Ocultar Detalles
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        Ver Detalles
                      </>
                    )}
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  {/* Campos siempre visibles */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Search size={16} className="me-2" />
                        Buscar Cliente Existente
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
                            {client.name} {client.lastName} -{" "}
                            {client.phoneNumber}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Información de caja registradora - Solo para usuarios Cajero */}
                  {!isSocialMedia && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          <CreditCard size={16} className="me-2" />
                          Caja Registradora
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
                        {cashRegister && !cashRegister.isOpen && (
                          <Alert variant="warning" className="mt-2 mb-0 py-2">
                            <small>
                              ⚠️ La caja está cerrada. Dirígete a la página de Cajas para abrirla.
                            </small>
                          </Alert>
                        )}
                        {!cashRegister && !loadingCashRegister && (
                          <Alert variant="info" className="mt-2 mb-0 py-2">
                            <small>
                              ℹ️ No tienes una caja asignada. Dirígete a la página
                              de Cajas Registradoras para abrir una.
                            </small>
                          </Alert>
                        )}
                      </Form.Group>
                    </Col>
                  )}

                  {/* Detalles del cliente - solo visibles cuando showClientInfo es true */}
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
                              setFormData({
                                ...formData,
                                clientInfo: {
                                  ...formData.clientInfo,
                                  name: e.target.value,
                                },
                              });
                              setSelectedClientId("");
                            }}
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
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                clientInfo: {
                                  ...formData.clientInfo,
                                  phone: e.target.value,
                                },
                              });
                              setSelectedClientId("");
                            }}
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
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                clientInfo: {
                                  ...formData.clientInfo,
                                  email: e.target.value,
                                },
                              });
                              setSelectedClientId("");
                            }}
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>

                      {/* Solo mostrar Canal de Venta si NO es usuario de Redes ni Cajero */}
                      {!isSocialMedia && !isCashier && (
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">
                              <Store size={16} className="me-2" />
                              Canal de Venta
                            </Form.Label>
                            <Form.Select
                              value={formData.salesChannel}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  salesChannel: e.target.value as
                                    | "tienda"
                                    | "whatsapp"
                                    | "facebook"
                                    | "instagram",
                                })
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

            {/* Productos */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Package size={20} className="text-primary" />
                  <h5 className="mb-0 fw-bold">Productos</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3 mb-3 align-items-end">
                  <Col xs={6} sm={3} md={2} lg={1}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Cant.</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                        className="py-2 mx-2 text-center"
                        style={{ minWidth: "70px" }}
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12} sm={9} md={5} lg={5}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Nombre del Producto
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nombre del producto"
                        value={currentProductName}
                        onChange={(e) => setCurrentProductName(e.target.value)}
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={6} sm={4} md={2} lg={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Precio</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={currentItem.unitPrice || ""}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            unitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={6} sm={4} md={2} lg={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Importe</Form.Label>
                      <Form.Control
                        type="text"
                        value={`$${calculateItemAmount().toFixed(2)}`}
                        disabled
                        className="py-2 bg-light"
                      />
                    </Form.Group>
                  </Col>

                  <Col
                    xs={12}
                    sm={4}
                    md={1}
                    lg={2}
                    className="d-flex align-items-end"
                  >
                    <Button
                      variant="primary"
                      onClick={handleAddItem}
                      className="w-100 py-2"
                    >
                      <Plus size={20} />
                    </Button>
                  </Col>
                </Row>

                {/* Lista de items */}
                {formData.items.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "10%" }}>Cantidad</th>
                          <th style={{ width: "40%" }}>Nombre del Producto</th>
                          <th style={{ width: "10%" }}>Tipo</th>
                          <th style={{ width: "15%" }}>Precio Unit.</th>
                          <th style={{ width: "15%" }}>Importe</th>
                          <th style={{ width: "10%" }} className="text-center">
                            Quitar
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.quantity}</td>
                            <td>{item.productName}</td>
                            <td>
                              <Badge
                                bg={item.isProduct ? "success" : "secondary"}
                                className="text-white"
                              >
                                {item.isProduct ? "Existente" : "Manual"}
                              </Badge>
                            </td>
                            <td>${item.unitPrice.toFixed(2)}</td>
                            <td className="fw-bold">
                              ${item.amount.toFixed(2)}
                            </td>
                            <td className="text-center">
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>

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
                  {/* Para usuarios de Redes, mostrar solo "Redes Sociales" y el select de plataforma */}
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
                          <Form.Control
                            type="text"
                            value="Redes Sociales"
                            disabled
                            className="py-2 bg-light"
                          />
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
                              setFormData({
                                ...formData,
                                socialMedia: platform,
                                salesChannel: platform, // Sincronizar salesChannel con socialMedia
                              });
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
                    /* Para usuarios normales, mostrar opciones de envío tradicionales */
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
                            onChange={(e) =>
                              handleShippingTypeChange(e.target.value as ShippingType)
                            }
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
                              setFormData({
                                ...formData,
                                anonymous: e.target.checked,
                              })
                            }
                          />
                          <Form.Check
                            type="checkbox"
                            id="venta-rapida-check"
                            label="Venta Rápida"
                            checked={formData.quickSale}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                quickSale: e.target.checked,
                              })
                            }
                          />
                        </div>
                      </div>
                    </Col>
                  )}

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <User size={16} className="me-2" />
                        Nombre de quien recibe
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nombre del receptor"
                        value={formData.deliveryData.recipientName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryData: {
                              ...formData.deliveryData,
                              recipientName: e.target.value,
                            },
                          })
                        }
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Calendar size={16} className="me-2" />
                        Fecha y Hora de Entrega
                      </Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={formData.deliveryData.deliveryDateTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryData: {
                              ...formData.deliveryData,
                              deliveryDateTime: e.target.value,
                            },
                          })
                        }
                        min={new Date().toISOString().slice(0, 16)}
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <MessageSquare size={16} className="me-2" />
                        Mensaje / Comentario
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Escribe el mensaje en la tarjeta o algún comentario"
                        value={formData.deliveryData.message}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryData: {
                              ...formData.deliveryData,
                              message: e.target.value,
                            },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>

                  {/* Campos de dirección solo para tipo de envío "envio" */}
                  {formData.shippingType === "envio" && (
                    <>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Calle y Número
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Ej: Av. Principal #123"
                            value={formData.deliveryData.street}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                deliveryData: {
                                  ...formData.deliveryData,
                                  street: e.target.value,
                                },
                              })
                            }
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Colonia
                          </Form.Label>
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
                          <Form.Label className="fw-semibold">
                            Señas o Referencias
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Ej: Casa blanca con portón negro, entre calle X y Y"
                            value={formData.deliveryData.reference}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                deliveryData: {
                                  ...formData.deliveryData,
                                  reference: e.target.value,
                                },
                              })
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
                        Adjunte el comprobante
                      </Form.Label>
                      <Form.Control
                        type="file"
                        className="py-2"
                        accept="image/*,.pdf"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setComprobanteFile(file);
                          }
                        }}
                      />
                      {comprobanteFile && (
                        <Form.Text className="text-success">
                          ✓ Archivo seleccionado: {comprobanteFile.name}
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Upload size={16} className="me-2" />
                        Adjunte arreglo
                      </Form.Label>
                      <Form.Control
                        type="file"
                        className="py-2"
                        accept="image/*"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setArregloFile(file);
                          }
                        }}
                      />
                      {arregloFile && (
                        <Form.Text className="text-success">
                          ✓ Archivo seleccionado: {arregloFile.name}
                        </Form.Text>
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
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Calendar size={16} className="me-2" />
                        Fecha y Hora de Orden
                      </Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={formData.orderDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            orderDate: e.target.value,
                          })
                        }
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Label className="fw-semibold">
                      Método de Pago
                    </Form.Label>
                    <div className="d-flex gap-2 flex-wrap">
                      {loadingPaymentMethods ? (
                        <div className="text-muted">
                          Cargando métodos de pago...
                        </div>
                      ) : paymentMethods.length === 0 ? (
                        <Alert variant="danger" className="mb-0 w-100">
                          No hay métodos de pago disponibles. Debes crear al
                          menos un método de pago para poder crear órdenes.
                        </Alert>
                      ) : (
                        paymentMethods.map((method) => {
                          // Deshabilitar método "Efectivo" para usuarios de Redes
                          const isDisabled = isSocialMedia && method.name.toLowerCase() === "efectivo";

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
                                setFormData({
                                  ...formData,
                                  paymentMethod: method._id,
                                })
                              }
                              disabled={isDisabled}
                              className="px-3"
                              title={isDisabled ? "Los usuarios de Redes Sociales no pueden usar efectivo" : ""}
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
                          onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0, formData.discountType || "porcentaje")}
                          disabled={hasPendingDiscountAuth}
                          className="py-2"
                          placeholder="Ingresa el descuento"
                        />
                        <Form.Select
                          value={formData.discountType}
                          onChange={(e) => handleDiscountChange(formData.discount || 0, e.target.value as "porcentaje" | "cantidad")}
                          disabled={hasPendingDiscountAuth}
                          style={{ maxWidth: "100px" }}
                        >
                          <option value="porcentaje">%</option>
                          <option value="cantidad">$</option>
                        </Form.Select>
                        {!hasPendingDiscountAuth && formData.discount > 0 && (
                          <Button
                            variant="warning"
                            onClick={() => setShowDiscountRequestDialog(true)}
                            className="d-flex align-items-center gap-2"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            <Shield size={16} />
                            Solicitar Autorización
                          </Button>
                        )}
                      </div>
                      <Alert variant={hasPendingDiscountAuth ? "warning" : "info"} className="mt-2 mb-0 py-2">
                        <small>
                          {hasPendingDiscountAuth
                            ? "⚠️ Descuento pendiente de autorización. Se enviará la solicitud al crear la orden."
                            : "ℹ️ Ingresa el descuento y solicita autorización antes de crear la orden."}
                        </small>
                      </Alert>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Subtotal:</span>
                      <span className="fw-bold">
                        ${formData.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Descuento:</span>
                      <span className="text-danger fw-bold">
                        -$
                        {(formData.discountType === "porcentaje"
                          ? (formData.subtotal * (formData.discount || 0)) / 100
                          : formData.discount || 0
                        ).toFixed(2)}
                      </span>
                    </div>
                    {formData.shippingType === "envio" && (formData.deliveryData.deliveryPrice || 0) > 0 && (
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted">Costo de Envío:</span>
                        <span className="text-success fw-bold">
                          +${(formData.deliveryData.deliveryPrice || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between align-items-center py-2 border-top">
                      <span className="fs-5 fw-bold">Total:</span>
                      <span className="fs-4 fw-bold text-primary">
                        ${formData.total.toFixed(2)}
                      </span>
                    </div>
                  </Col>

                  <Col md={12}>
                    <hr />
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Anticipo</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.advance}
                        onChange={(e) =>
                          handleAdvanceChange(parseFloat(e.target.value) || 0)
                        }
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
                        placeholder="0.00"
                        value={formData.paidWith}
                        onChange={(e) =>
                          handlePaidWithChange(parseFloat(e.target.value) || 0)
                        }
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
                        value={`$${(formData.remainingBalance || 0).toFixed(
                          2
                        )}`}
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
                        setFormData({
                          ...formData,
                          sendToProduction: e.target.checked,
                        })
                      }
                      className="mt-2"
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Botón Aceptar */}
            <div className="d-flex justify-content-end gap-2 mb-4">
              <Button
                type="button"
                variant="outline-secondary"
                size="lg"
                onClick={() => window.history.back()}
              >
                Cancelar
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
                  !cashRegister || // Validar que haya caja asignada (para todos los usuarios)
                  (formData.items.some(item => item.isProduct === true) && !selectedStorageId) ||
                  (isSocialMedia && !formData.branchId) // Validar que Redes usuarios hayan seleccionado sucursal
                }
                className="px-5"
              >
                {uploadingFiles ? "Subiendo archivos..." : loading ? "Procesando..." : "Aceptar"}
              </Button>
            </div>
          </Form>
        </Col>

        {/* Catálogo de Productos - 35% derecha */}
        <Col xs={12} lg={4} className="order-1 order-lg-2">
          <div
            className="position-sticky"
            style={{ top: "20px", height: "calc(100vh - 160px)" }}
          >
            <ProductCatalog
              onAddProduct={handleAddProductFromCatalog}
              branchId={formData.branchId}
              itemsInOrder={formData.items}
              storage={storage}
            />
          </div>
        </Col>
      </Row>

      {/* Modal de Solicitud de Autorización de Descuento */}
      <Modal
        show={showDiscountRequestDialog}
        onHide={() => {
          setShowDiscountRequestDialog(false);
          setDiscountRequestMessage("");
        }}
        centered
      >
        <Modal.Header closeButton className="bg-warning text-white">
          <Modal.Title className="d-flex align-items-center gap-2">
            <Shield size={24} />
            Confirmar Solicitud de Descuento
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <strong>ℹ️ Información:</strong> El descuento se aplicará inmediatamente a la orden, pero necesita autorización del gerente antes de enviarse a producción.
          </Alert>

          <div className="mb-3 p-3 border rounded bg-light">
            <h6 className="fw-bold mb-2">Descuento solicitado:</h6>
            <p className="mb-0 fs-5 text-primary">
              {formData.discount} {formData.discountType === "porcentaje" ? "%" : "$"}
            </p>
          </div>

          <Form.Group>
            <Form.Label className="fw-semibold">
              Motivo de la solicitud <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe el motivo por el cual solicitas este descuento..."
              value={discountRequestMessage}
              onChange={(e) => setDiscountRequestMessage(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              El gerente recibirá esta solicitud junto con la orden creada. Si la rechaza, la orden será cancelada automáticamente.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDiscountRequestDialog(false);
              setDiscountRequestMessage("");
            }}
            disabled={requestingDiscount}
          >
            Cancelar
          </Button>
          <Button
            variant="warning"
            onClick={handleRequestDiscountAuth}
            disabled={requestingDiscount || !discountRequestMessage.trim()}
            className="d-flex align-items-center gap-2"
          >
            <Shield size={16} />
            {requestingDiscount ? "Aplicando..." : "Aplicar y Continuar"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NewOrderPage;
